package com.leedahye.stagepin.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

@RestController
@RequestMapping("/api/v1/auth")
public class MemberAuthController {
    static final String COOKIE = "stagepin_session";
    private static final Duration SESSION_TTL = Duration.ofDays(7);
    private final KakaoAuthSettings settings;
    private final KakaoLoginClient kakao;
    private final MemberAuthStore store;
    public MemberAuthController(KakaoAuthSettings settings, KakaoLoginClient kakao, MemberAuthStore store) {
        this.settings = settings;
        this.kakao = kakao;
        this.store = store;
    }
    @ModelAttribute
    void noCache(HttpServletResponse response) {
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        response.setHeader("Referrer-Policy", "no-referrer");
    }
    @GetMapping("/config")
    Map<String, Object> config() { return Map.of("kakaoEnabled", settings.enabled()); }

    @PostMapping(value = "/kakao/start", consumes = MediaType.APPLICATION_JSON_VALUE)
    Map<String, String> start(@Valid @RequestBody StartRequest body, HttpServletRequest request) {
        if (!settings.enabled()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "카카오 로그인 설정이 아직 완료되지 않았어요.");
        if ("WEB".equals(body.client())) requireWebOrigin(request);
        String state = AuthSecrets.random();
        store.start(state, body.challenge(), body.client(), Instant.now().plusSeconds(300));
        return Map.of("authorizationUrl", Boolean.TRUE.equals(body.profileConsent()) ? kakao.authorizationUrl(state, true) : kakao.authorizationUrl(state));
    }
    @GetMapping("/kakao/callback")
    ResponseEntity<Void> callback(@RequestParam(required = false) String state,
            @RequestParam(required = false) String code, @RequestParam(required = false) String error) {
        if (state == null || !state.matches("[A-Za-z0-9_-]{43}")) throw invalid();
        var attempt = store.consumeState(state, Instant.now());
        if (attempt == null) throw invalid();
        if (error != null || code == null || code.length() > 2048) return redirect(attempt.client(), "error", "cancelled");
        try {
            var member = store.member(kakao.authenticate(code));
            String exchange = AuthSecrets.random();
            store.ready(attempt.id(), member, exchange, Instant.now().plusSeconds(60));
            return redirect(attempt.client(), "code", exchange);
        } catch (RuntimeException exception) {
            // Never log provider responses, authorization codes, tokens or request URLs.
            return redirect(attempt.client(), "error", "provider_unavailable");
        }
    }
    @PostMapping(value = "/exchange", consumes = MediaType.APPLICATION_JSON_VALUE)
    ResponseEntity<ExchangeResponse> exchange(@Valid @RequestBody ExchangeRequest body, HttpServletRequest request) {
        var login = store.exchange(body.code(), body.verifier(), Instant.now());
        if (login == null) throw invalid();
        if ("WEB".equals(login.client())) requireWebOrigin(request);
        String token = AuthSecrets.random();
        Instant expiry = Instant.now().plus(SESSION_TTL);
        store.session(login.memberId(), token, expiry);
        var builder = ResponseEntity.ok();
        if ("WEB".equals(login.client())) builder.header(HttpHeaders.SET_COOKIE, cookie(token, SESSION_TTL, request).toString());
        return builder.body(new ExchangeResponse("NATIVE".equals(login.client()) ? token : null, expiry));
    }
    @GetMapping("/me")
    MemberAuthStore.Member me(HttpServletRequest request) {
        var member = store.me(token(request), Instant.now());
        if (member == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요해요.");
        return member;
    }
    @PostMapping("/logout")
    ResponseEntity<Void> logout(HttpServletRequest request) {
        if (request.getHeader(HttpHeaders.AUTHORIZATION) == null) requireWebOrigin(request);
        store.logout(token(request));
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, cookie("", Duration.ZERO, request).toString()).build();
    }
    private void requireWebOrigin(HttpServletRequest request) {
        if (!settings.webUrl().equals(request.getHeader(HttpHeaders.ORIGIN)))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "허용되지 않은 로그인 요청이에요.");
    }
    private ResponseCookie cookie(String token, Duration maxAge, HttpServletRequest request) {
        return ResponseCookie.from(COOKIE, token).httpOnly(true).secure(settings.webUrl().startsWith("https://"))
                .sameSite("Lax").path("/api").maxAge(maxAge).build();
    }
    private String token(HttpServletRequest request) {
        String auth = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (auth != null) return auth.startsWith("Bearer ") ? auth.substring(7) : null;
        if (request.getCookies() != null) for (var cookie : request.getCookies()) if (COOKIE.equals(cookie.getName())) return cookie.getValue();
        return null;
    }
    private ResponseEntity<Void> redirect(String client, String key, String value) {
        URI uri = UriComponentsBuilder.fromUriString(settings.returnUri(client)).queryParam(key, value).build().encode().toUri();
        return ResponseEntity.status(HttpStatus.FOUND).location(uri).build();
    }
    private ResponseStatusException invalid() { return new ResponseStatusException(HttpStatus.BAD_REQUEST, "로그인 요청이 만료되었거나 유효하지 않아요. 다시 시작해 주세요."); }
    record StartRequest(@Pattern(regexp = "WEB|NATIVE") @jakarta.validation.constraints.NotNull String client,
                        @Pattern(regexp = "[A-Za-z0-9_-]{43}") @jakarta.validation.constraints.NotNull String challenge, Boolean profileConsent) { }
    record ExchangeRequest(@Pattern(regexp = "[A-Za-z0-9_-]{43}") @jakarta.validation.constraints.NotNull String code,
                           @Pattern(regexp = "[A-Za-z0-9._~-]{43,128}") @jakarta.validation.constraints.NotNull String verifier) { }
    record ExchangeResponse(String token, Instant expiresAt) { }
}

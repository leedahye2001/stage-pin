package com.leedahye.stagepin.auth;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class MemberSessionAccess {
    private final MemberAuthStore store;
    private final KakaoAuthSettings settings;

    public MemberSessionAccess(MemberAuthStore store, KakaoAuthSettings settings) {
        this.store = store;
        this.settings = settings;
    }

    public MemberAuthStore.Member requireMember(HttpServletRequest request) {
        var member = store.me(token(request), Instant.now());
        if (member == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요해요.");
        return member;
    }

    public MemberAuthStore.Member requireWriter(HttpServletRequest request) {
        var member = requireMember(request);
        // Cookie writes require the exact app origin, including multipart/simple requests.
        if (request.getHeader(HttpHeaders.AUTHORIZATION) == null) requireWebOrigin(request, settings.webUrl());
        return member;
    }

    static void requireWebOrigin(HttpServletRequest request, String webUrl) {
        if (!webUrl.equals(request.getHeader(HttpHeaders.ORIGIN)))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "허용되지 않은 로그인 요청이에요.");
    }

    static String token(HttpServletRequest request) {
        String auth = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (auth != null) return auth.startsWith("Bearer ") ? auth.substring(7) : null;
        if (request.getCookies() != null) for (var cookie : request.getCookies())
            if (MemberAuthController.COOKIE.equals(cookie.getName())) return cookie.getValue();
        return null;
    }
}

package com.leedahye.stagepin.auth;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class KakaoLoginClient {
    private final KakaoAuthSettings settings;
    private final RestClient http;
    @Autowired
    public KakaoLoginClient(KakaoAuthSettings settings) {
        this(settings, RestClient.builder().requestFactory(requestFactory()));
    }
    KakaoLoginClient(KakaoAuthSettings settings, RestClient.Builder builder) {
        this.settings = settings;
        this.http = builder.build();
    }
    private static JdkClientHttpRequestFactory requestFactory() {
        var factory = new JdkClientHttpRequestFactory();
        factory.setReadTimeout(Duration.ofSeconds(15));
        return factory;
    }
    String authorizationUrl(String state) {
        return authorizationUrl(state, false);
    }
    String authorizationUrl(String state, boolean profileConsent) {
        var uri = UriComponentsBuilder.fromUriString("https://kauth.kakao.com/oauth/authorize")
                .queryParam("client_id", settings.clientId()).queryParam("redirect_uri", settings.redirectUri())
                .queryParam("response_type", "code").queryParam("state", state);
        // Additional consent for existing members; never request an unapproved email scope.
        if (profileConsent) uri.queryParam("scope", "profile_nickname");
        return uri.build().encode().toUriString();
    }
    Profile authenticate(String code) {
        var form = new LinkedMultiValueMap<String, String>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", settings.clientId());
        form.add("redirect_uri", settings.redirectUri());
        form.add("code", code);
        if (!settings.clientSecret().isBlank()) form.add("client_secret", settings.clientSecret());
        Token token = http.post().uri("https://kauth.kakao.com/oauth/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form).retrieve().body(Token.class);
        if (token == null || token.access_token() == null || token.access_token().isBlank()) throw new IllegalStateException("Kakao token missing");
        KakaoUser user = http.get().uri("https://kapi.kakao.com/v2/user/me")
                .headers(headers -> headers.setBearerAuth(token.access_token())).retrieve().body(KakaoUser.class);
        if (user == null || user.id() <= 0) throw new IllegalStateException("Kakao identity missing");
        var profile = user.kakao_account() == null ? null : user.kakao_account().profile();
        String nickname = profile == null || profile.nickname() == null ? "스테이지핀 사용자" : profile.nickname().strip();
        if (nickname.isBlank()) nickname = "스테이지핀 사용자";
        String image = profile == null ? null : profile.profile_image_url();
        if (image != null && !image.startsWith("https://")) image = null;
        return new Profile(Long.toString(user.id()), nickname.substring(0, Math.min(nickname.length(), 80)), image, verifiedEmail(user.kakao_account()));
    }
    private String verifiedEmail(Account account) {
        if (account == null || Boolean.TRUE.equals(account.email_needs_agreement())
                || !Boolean.TRUE.equals(account.is_email_valid()) || !Boolean.TRUE.equals(account.is_email_verified())) return null;
        String email = account.email() == null ? null : account.email().strip();
        return email != null && !email.isBlank() && email.length() <= 254 ? email : null;
    }
    record Token(String access_token) { }
    record KakaoUser(long id, Account kakao_account) { }
    record Account(KakaoProfile profile, String email, Boolean email_needs_agreement,
                   Boolean is_email_valid, Boolean is_email_verified) { }
    record KakaoProfile(String nickname, String profile_image_url) { }
    record Profile(String subject, String nickname, String imageUrl, String email) { }
}

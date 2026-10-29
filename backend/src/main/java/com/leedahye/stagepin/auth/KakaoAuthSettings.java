package com.leedahye.stagepin.auth;

import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public record KakaoAuthSettings(
        @Value("${KAKAO_REST_API_KEY:}") String clientId,
        @Value("${KAKAO_CLIENT_SECRET:}") String clientSecret,
        @Value("${KAKAO_REDIRECT_URI:http://localhost:8080/api/v1/auth/kakao/callback}") String redirectUri,
        @Value("${STAGEPIN_WEB_URL:http://localhost:8081}") String webUrl) {
    public KakaoAuthSettings {
        validateUrl(redirectUri);
        validateUrl(webUrl);
        URI web = URI.create(webUrl);
        if (web.getQuery() != null || web.getFragment() != null || !(web.getPath().isEmpty() || web.getPath().equals("/"))) {
            throw new IllegalArgumentException("STAGEPIN_WEB_URL must be an origin without a path");
        }
        webUrl = webUrl.replaceAll("/+$", "");
    }
    public boolean enabled() { return !clientId.isBlank(); }
    public String returnUri(String client) { return "NATIVE".equals(client) ? "stagepin://auth/callback" : webUrl + "/auth/callback"; }
    private static void validateUrl(String value) {
        URI uri = URI.create(value);
        boolean local = "localhost".equals(uri.getHost()) || "127.0.0.1".equals(uri.getHost());
        if (uri.getHost() == null || uri.getUserInfo() != null || !("https".equals(uri.getScheme()) || local && "http".equals(uri.getScheme()))) {
            throw new IllegalArgumentException("Authentication URLs require HTTPS (except loopback development)");
        }
    }
}

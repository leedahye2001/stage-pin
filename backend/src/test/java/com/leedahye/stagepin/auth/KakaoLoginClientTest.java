package com.leedahye.stagepin.auth;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class KakaoLoginClientTest {
    @Test
    void exchangesTheCodeOnTheServerAndUsesTheProviderSubjectNotEmail() {
        var builder = RestClient.builder();
        var server = MockRestServiceServer.bindTo(builder).build();
        var settings = new KakaoAuthSettings("test-client", "test-secret", "http://localhost:8080/api/v1/auth/kakao/callback", "http://localhost:8081");
        var client = new KakaoLoginClient(settings, builder);
        server.expect(requestTo("https://kauth.kakao.com/oauth/token")).andExpect(method(HttpMethod.POST))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("client_secret=test-secret")))
                .andRespond(withSuccess("{\"access_token\":\"provider-token\",\"refresh_token\":\"unused\"}", MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://kapi.kakao.com/v2/user/me")).andExpect(header("Authorization", "Bearer provider-token"))
                .andRespond(withSuccess("{\"id\":123456,\"kakao_account\":{\"email\":\"fan@example.com\",\"is_email_valid\":true,\"is_email_verified\":true,\"email_needs_agreement\":false,\"profile\":{\"nickname\":\"팬\",\"profile_image_url\":\"https://example.com/profile.png\"}}}", MediaType.APPLICATION_JSON));
        var profile = client.authenticate("authorization-code");
        assertThat(profile.subject()).isEqualTo("123456");
        assertThat(profile.nickname()).isEqualTo("팬");
        assertThat(profile.email()).isEqualTo("fan@example.com");
        assertThat(client.authorizationUrl("state")).contains("state=state", "response_type=code").doesNotContain("test-secret");
        assertThat(client.authorizationUrl("state", true)).contains("scope=profile_nickname").doesNotContain("account_email", "test-secret");
        server.verify();
    }
    @Test
    void missingOptionalProfileDoesNotPreventLogin() {
        var builder = RestClient.builder();
        var server = MockRestServiceServer.bindTo(builder).build();
        var client = new KakaoLoginClient(new KakaoAuthSettings("client", "", "http://localhost:8080/callback", "http://localhost:8081"), builder);
        server.expect(requestTo("https://kauth.kakao.com/oauth/token")).andRespond(withSuccess("{\"access_token\":\"token\"}", MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://kapi.kakao.com/v2/user/me")).andRespond(withSuccess("{\"id\":1}", MediaType.APPLICATION_JSON));
        var profile = client.authenticate("code");
        assertThat(profile.nickname()).isEqualTo("스테이지핀 사용자");
        assertThat(profile.email()).isNull();
        server.verify();
    }
    @Test
    void unverifiedInvalidOrUnconsentedEmailIsNotStored() {
        for (String flags : new String[]{"\"is_email_verified\":false,\"is_email_valid\":true",
                "\"is_email_verified\":true,\"is_email_valid\":false",
                "\"is_email_verified\":true,\"is_email_valid\":true,\"email_needs_agreement\":true", "\"has_email\":true"}) {
            var builder = RestClient.builder();
            var server = MockRestServiceServer.bindTo(builder).build();
            var client = new KakaoLoginClient(new KakaoAuthSettings("client", "", "http://localhost:8080/callback", "http://localhost:8081"), builder);
            server.expect(requestTo("https://kauth.kakao.com/oauth/token")).andRespond(withSuccess("{\"access_token\":\"token\"}", MediaType.APPLICATION_JSON));
            server.expect(requestTo("https://kapi.kakao.com/v2/user/me")).andRespond(withSuccess("{\"id\":1,\"kakao_account\":{\"email\":\"fan@example.com\"," + flags + "}}", MediaType.APPLICATION_JSON));
            assertThat(client.authenticate("code").email()).isNull();
            server.verify();
        }
    }
}

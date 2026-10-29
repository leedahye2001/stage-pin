package com.leedahye.stagepin.auth;

import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class MemberAuthControllerTest {
    private MemberAuthStore store;
    private KakaoLoginClient kakao;
    private MockMvc mvc;
    private final UUID member = UUID.randomUUID();
    private final String code = "a".repeat(43);
    private final String verifier = "v".repeat(64);
    @BeforeEach
    void setup() {
        store = mock(MemberAuthStore.class);
        kakao = mock(KakaoLoginClient.class);
        mvc = MockMvcBuilders.standaloneSetup(new MemberAuthController(
                new KakaoAuthSettings("key", "", "https://api.example.com/api/v1/auth/kakao/callback", "https://app.example.com"), kakao, store)).build();
    }
    @Test
    void disabledConfigurationIsSafeAndDoesNotCreateAttempts() throws Exception {
        mvc = MockMvcBuilders.standaloneSetup(new MemberAuthController(new KakaoAuthSettings("", "", "http://localhost:8080/callback", "http://localhost:8081"), kakao, store)).build();
        mvc.perform(get("/api/v1/auth/config")).andExpect(status().isOk()).andExpect(jsonPath("$.kakaoEnabled").value(false));
        mvc.perform(post("/api/v1/auth/kakao/start").contentType(MediaType.APPLICATION_JSON).content("{\"client\":\"WEB\",\"challenge\":\"" + code + "\"}"))
                .andExpect(status().isServiceUnavailable());
        verifyNoInteractions(store);
    }
    @Test
    void webExchangeUsesSecureHttpOnlyCookieAndNeverReturnsTheTokenInJson() throws Exception {
        when(store.exchange(eq(code), eq(verifier), any())).thenReturn(new MemberAuthStore.Login(member, "WEB"));
        mvc.perform(post("/api/v1/auth/exchange").header("Origin", "https://app.example.com").contentType(MediaType.APPLICATION_JSON)
                .content(exchangeBody())).andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.allOf(org.hamcrest.Matchers.containsString("HttpOnly"), org.hamcrest.Matchers.containsString("Secure"), org.hamcrest.Matchers.containsString("SameSite=Lax"))))
                .andExpect(jsonPath("$.token").doesNotExist());
        verify(store).session(eq(member), matches("[A-Za-z0-9_-]{43}"), any());
    }
    @Test
    void nativeExchangeReturnsOnlyTheAppTokenAndReplayIsRejected() throws Exception {
        when(store.exchange(eq(code), eq(verifier), any())).thenReturn(new MemberAuthStore.Login(member, "NATIVE")).thenReturn(null);
        mvc.perform(post("/api/v1/auth/exchange").contentType(MediaType.APPLICATION_JSON).content(exchangeBody()))
                .andExpect(status().isOk()).andExpect(header().doesNotExist("Set-Cookie")).andExpect(jsonPath("$.token").isString());
        mvc.perform(post("/api/v1/auth/exchange").contentType(MediaType.APPLICATION_JSON).content(exchangeBody())).andExpect(status().isBadRequest());
        verify(store, times(1)).session(eq(member), anyString(), any());
    }
    @Test
    void wrongOriginAndInvalidVerifierDoNotCreateSessions() throws Exception {
        when(store.exchange(eq(code), eq(verifier), any())).thenReturn(new MemberAuthStore.Login(member, "WEB"));
        mvc.perform(post("/api/v1/auth/exchange").header("Origin", "https://evil.example.com").contentType(MediaType.APPLICATION_JSON).content(exchangeBody()))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/auth/exchange").contentType(MediaType.APPLICATION_JSON).content("{\"code\":\"" + code + "\",\"verifier\":\"short\"}"))
                .andExpect(status().isBadRequest());
        verify(store, never()).session(any(), anyString(), any());
    }
    @Test
    void callbackRequiresValidSingleUseStateAndNeverAcceptsAReturnUrl() throws Exception {
        mvc.perform(get("/api/v1/auth/kakao/callback").param("state", code).param("code", "provider-code")).andExpect(status().isBadRequest());
        verifyNoInteractions(kakao);
        when(store.consumeState(eq(code), any())).thenReturn(new MemberAuthStore.Attempt(UUID.randomUUID(), "WEB"));
        mvc.perform(get("/api/v1/auth/kakao/callback").param("state", code).param("error", "access_denied").param("returnTo", "https://evil.example.com"))
                .andExpect(status().isFound()).andExpect(redirectedUrl("https://app.example.com/auth/callback?error=cancelled"));
    }
    @Test
    void meNeedsAValidSessionAndCookieLogoutChecksTheOrigin() throws Exception {
        mvc.perform(get("/api/v1/auth/me")).andExpect(status().isUnauthorized());
        when(store.me(eq(code), any())).thenReturn(new MemberAuthStore.Member(member, "팬", null, "fan@example.com"));
        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + code)).andExpect(status().isOk()).andExpect(jsonPath("$.nickname").value("팬"));
        mvc.perform(post("/api/v1/auth/logout")).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/auth/logout").header("Authorization", "Bearer " + code)).andExpect(status().isNoContent());
        verify(store).logout(code);
    }
    @Test
    void pkceUsesTheRfc7636VectorAndSecretsAreUnpredictable() {
        assertThat(AuthSecrets.challenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).isEqualTo("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
        assertThat(AuthSecrets.random()).matches("[A-Za-z0-9_-]{43}").isNotEqualTo(AuthSecrets.random());
        assertThat(AuthSecrets.hash(code)).hasSize(64).doesNotContain(code);
        assertThatThrownBy(() -> new KakaoAuthSettings("key", "", "http://example.com/callback", "https://app.example.com")).isInstanceOf(IllegalArgumentException.class);
    }
    private String exchangeBody() { return "{\"code\":\"" + code + "\",\"verifier\":\"" + verifier + "\"}"; }
}

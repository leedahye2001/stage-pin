package com.leedahye.stagepin.auth;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.Callable;
import jakarta.servlet.http.Cookie;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.util.UriComponentsBuilder;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.transaction.support.TransactionTemplate;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// Optional real-Postgres checks: use a fresh disposable database, never application data.
@EnabledIfEnvironmentVariable(named = "AUTH_TEST_JDBC_URL", matches = ".+/stagepin_auth_test")
class MemberAuthStoreDatabaseTest {
    static JdbcTemplate jdbc;
    static MemberAuthStore store;
    static TransactionTemplate tx;
    @BeforeAll
    static void schema() {
        var source = new DriverManagerDataSource(System.getenv("AUTH_TEST_JDBC_URL"), "auth_test", "auth_test");
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V6__create_member_auth.sql"),
                new ClassPathResource("db/migration/V7__add_member_email.sql")).execute(source);
        jdbc = new JdbcTemplate(source);
        store = new MemberAuthStore(jdbc);
        tx = new TransactionTemplate(new DataSourceTransactionManager(source));
    }
    @Test
    void stateIsSingleUseAndExpiredStateIsRejected() {
        String state = AuthSecrets.random();
        Instant now = Instant.now();
        store.start(state, "c".repeat(43), "WEB", now.plusSeconds(300));
        assertThat(store.consumeState("wrong", now)).isNull();
        assertThat(store.consumeState(state, now)).isNotNull();
        assertThat(store.consumeState(state, now)).isNull();
        String expired = AuthSecrets.random();
        store.start(expired, "c".repeat(43), "NATIVE", now.minusSeconds(1));
        assertThat(store.consumeState(expired, now)).isNull();
    }
    @Test
    void exchangeChecksPkceExpiryAndReplayAndOnlyStoresHashedSessionTokens() {
        Instant now = Instant.now();
        String verifier = "v".repeat(64), state = AuthSecrets.random(), code = AuthSecrets.random();
        UUID member = tx.execute(status -> store.member(new KakaoLoginClient.Profile("test-member", "팬", null, "fan@example.com")));
        store.start(state, AuthSecrets.challenge(verifier), "WEB", now.plusSeconds(300));
        var attempt = store.consumeState(state, now);
        store.ready(attempt.id(), member, code, now.plusSeconds(60));
        assertThat(store.exchange(code, "wrong".repeat(10), now)).isNull();
        assertThat(store.exchange(code, verifier, now).memberId()).isEqualTo(member);
        assertThat(store.exchange(code, verifier, now)).isNull();
        String token = AuthSecrets.random();
        store.session(member, token, now.plusSeconds(60));
        assertThat(store.me(token, now).nickname()).isEqualTo("팬");
        assertThat(store.me(token, now).email()).isEqualTo("fan@example.com");
        UUID updatedMember = tx.execute(status -> store.member(new KakaoLoginClient.Profile("test-member", "새 닉네임", null, null)));
        assertThat(updatedMember).isEqualTo(member);
        assertThat(store.me(token, now).nickname()).isEqualTo("새 닉네임");
        assertThat(store.me(token, now).email()).isNull();
        assertThat(store.me(token, now.plusSeconds(61))).isNull();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM member_session WHERE token_hash = ?", Integer.class, token)).isZero();
        store.logout(token);
        assertThat(store.me(token, now)).isNull();
    }
    @Test
    void concurrentFirstLoginsProduceOneMemberPerProviderSubject() throws Exception {
        Callable<UUID> login = () -> tx.execute(status -> store.member(new KakaoLoginClient.Profile("concurrent-member", "팬", null, null)));
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var first = executor.submit(login);
            var second = executor.submit(login);
            assertThat(first.get()).isEqualTo(second.get());
        }
        assertThat(jdbc.queryForObject("SELECT count(*) FROM member_identity WHERE subject = 'concurrent-member'", Integer.class)).isEqualTo(1);
    }

    @Test
    void aWebLoginPersistsCookieSessionRejectsReplayAndLogsOut() throws Exception {
        var kakao = mock(KakaoLoginClient.class);
        var mvc = controller(kakao);
        when(kakao.authenticate("fixture-provider-code")).thenReturn(new KakaoLoginClient.Profile("web-flow-member", "테스트 팬", null, null));
        String verifier = "w".repeat(64);
        String exchange = finishCallback(mvc, start(mvc, "WEB", verifier), null);
        var result = mvc.perform(post("/api/v1/auth/exchange").header("Origin", "https://app.example.com")
                .contentType(MediaType.APPLICATION_JSON).content(exchangeBody(exchange, verifier)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(header().string("Cache-Control", "no-store")).andReturn();
        String cookieHeader = result.getResponse().getHeader("Set-Cookie");
        assertThat(cookieHeader).contains("HttpOnly", "Secure", "SameSite=Lax", "Path=/api");
        Cookie cookie = new Cookie(MemberAuthController.COOKIE, cookieHeader.split(";", 2)[0].split("=", 2)[1]);
        for (int reload = 0; reload < 2; reload++) mvc.perform(get("/api/v1/auth/me").cookie(cookie))
                .andExpect(status().isOk()).andExpect(jsonPath("$.nickname").value("테스트 팬"));
        mvc.perform(post("/api/v1/auth/exchange").header("Origin", "https://app.example.com")
                .contentType(MediaType.APPLICATION_JSON).content(exchangeBody(exchange, verifier))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/auth/logout").header("Origin", "https://evil.example.com").cookie(cookie)).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/auth/me").cookie(cookie)).andExpect(status().isOk());
        mvc.perform(post("/api/v1/auth/logout").header("Origin", "https://app.example.com").cookie(cookie))
                .andExpect(status().isNoContent()).andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("Max-Age=0")));
        mvc.perform(get("/api/v1/auth/me").cookie(cookie)).andExpect(status().isUnauthorized());
        verify(kakao, times(1)).authenticate("fixture-provider-code");
    }

    @Test
    void aNativeLoginUsesBearerAndWrongVerifierDoesNotBurnTheExchange() throws Exception {
        var kakao = mock(KakaoLoginClient.class);
        var mvc = controller(kakao);
        when(kakao.authenticate("fixture-provider-code")).thenReturn(new KakaoLoginClient.Profile("native-flow-member", "앱 팬", null, null));
        String verifier = "n".repeat(64);
        String exchange = finishCallback(mvc, start(mvc, "NATIVE", verifier), null, "stagepin://auth/callback");
        mvc.perform(post("/api/v1/auth/exchange").contentType(MediaType.APPLICATION_JSON)
                .content(exchangeBody(exchange, "x".repeat(64)))).andExpect(status().isBadRequest());
        var result = mvc.perform(post("/api/v1/auth/exchange").contentType(MediaType.APPLICATION_JSON)
                .content(exchangeBody(exchange, verifier))).andExpect(status().isOk()).andExpect(header().doesNotExist("Set-Cookie")).andReturn();
        String token = tools.jackson.databind.json.JsonMapper.builder().build().readTree(result.getResponse().getContentAsString()).get("token").asText();
        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token)).andExpect(status().isOk());
        mvc.perform(post("/api/v1/auth/logout").header("Authorization", "Bearer " + token)).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token)).andExpect(status().isUnauthorized());
    }

    @Test
    void bCancelledAndFailedProviderLoginsNeverCreateSessions() throws Exception {
        var kakao = mock(KakaoLoginClient.class);
        var mvc = controller(kakao);
        int sessions = jdbc.queryForObject("SELECT count(*) FROM member_session", Integer.class);
        String cancelled = start(mvc, "WEB", "c".repeat(64));
        assertThat(finishCallback(mvc, cancelled, "access_denied")).isNull();
        verify(kakao, never()).authenticate(org.mockito.ArgumentMatchers.anyString());
        when(kakao.authenticate("fixture-provider-code")).thenThrow(new IllegalStateException("private provider response"));
        assertThat(finishCallback(mvc, start(mvc, "WEB", "e".repeat(64)), null)).isNull();
        mvc.perform(get("/api/v1/auth/me")).andExpect(status().isUnauthorized());
        assertThat(jdbc.queryForObject("SELECT count(*) FROM member_session", Integer.class)).isEqualTo(sessions);
    }

    @Test
    void bExpiredExchangeAndConcurrentReplayCannotCreateTwoLogins() throws Exception {
        Instant now = Instant.now();
        String verifier = "v".repeat(64), state = AuthSecrets.random(), code = AuthSecrets.random();
        UUID member = tx.execute(status -> store.member(new KakaoLoginClient.Profile("race-flow-member", "팬", null, null)));
        store.start(state, AuthSecrets.challenge(verifier), "WEB", now.plusSeconds(300));
        var attempt = store.consumeState(state, now);
        store.ready(attempt.id(), member, code, now);
        assertThat(store.exchange(code, verifier, now)).isNull();
        store.ready(attempt.id(), member, code, now.plusSeconds(60));
        Callable<MemberAuthStore.Login> exchange = () -> store.exchange(code, verifier, now);
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var first = executor.submit(exchange);
            var second = executor.submit(exchange);
            assertThat(java.util.stream.Stream.of(first.get(), second.get()).filter(java.util.Objects::nonNull).count()).isEqualTo(1);
        }
    }

    private MockMvc controller(KakaoLoginClient kakao) {
        var settings = new KakaoAuthSettings("fixture-client", "", "https://api.example.com/api/v1/auth/kakao/callback", "https://app.example.com");
        var urls = new KakaoLoginClient(settings);
        when(kakao.authorizationUrl(org.mockito.ArgumentMatchers.anyString())).thenAnswer(call -> urls.authorizationUrl(call.getArgument(0)));
        return MockMvcBuilders.standaloneSetup(new MemberAuthController(settings, kakao, store)).build();
    }
    private String start(MockMvc mvc, String client, String verifier) throws Exception {
        var result = mvc.perform(post("/api/v1/auth/kakao/start").header("Origin", "https://app.example.com").contentType(MediaType.APPLICATION_JSON)
                .content("{\"client\":\"" + client + "\",\"challenge\":\"" + AuthSecrets.challenge(verifier) + "\"}"))
                .andExpect(status().isOk()).andReturn();
        String url = tools.jackson.databind.json.JsonMapper.builder().build().readTree(result.getResponse().getContentAsString()).get("authorizationUrl").asText();
        return UriComponentsBuilder.fromUriString(url).build().getQueryParams().getFirst("state");
    }
    private String finishCallback(MockMvc mvc, String state, String error) {
        return finishCallback(mvc, state, error, "https://app.example.com/auth/callback");
    }
    private String finishCallback(MockMvc mvc, String state, String error, String returnUri) {
        // Production @Transactional member() is proxied; this standalone MVC fixture supplies that transaction explicitly.
        return tx.execute(status -> {
            try {
                var request = get("/api/v1/auth/kakao/callback").param("state", state).param("code", "fixture-provider-code");
                if (error != null) request.param("error", error);
                String location = mvc.perform(request).andExpect(status().isFound()).andReturn().getResponse().getHeader("Location");
                assertThat(location).startsWith(returnUri + "?");
                assertThat(location).doesNotContain("fixture-provider-code", "private provider response");
                mvc.perform(request).andExpect(status().isBadRequest());
                var params = UriComponentsBuilder.fromUriString(location).build().getQueryParams();
                String code = params.getFirst("code");
                assertThat(params.getFirst("error")).isEqualTo(error != null ? "cancelled" : code == null ? "provider_unavailable" : null);
                return code;
            } catch (Exception exception) { throw new AssertionError(exception); }
        });
    }
    private String exchangeBody(String code, String verifier) { return "{\"code\":\"" + code + "\",\"verifier\":\"" + verifier + "\"}"; }
}

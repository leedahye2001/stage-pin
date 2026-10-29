package com.leedahye.stagepin.auth;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.Callable;
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
}

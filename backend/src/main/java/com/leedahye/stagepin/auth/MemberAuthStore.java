package com.leedahye.stagepin.auth;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class MemberAuthStore {
    private final JdbcTemplate jdbc;
    public MemberAuthStore(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    void start(String state, String challenge, String client, Instant expiry) {
        jdbc.update("INSERT INTO member_login_attempt (id, state_hash, challenge, client_type, expires_at) VALUES (?, ?, ?, ?, ?)",
                UUID.randomUUID(), AuthSecrets.hash(state), challenge, client, Timestamp.from(expiry));
    }
    Attempt consumeState(String state, Instant now) {
        return jdbc.query("UPDATE member_login_attempt SET state_hash = NULL WHERE state_hash = ? AND expires_at > ? RETURNING id, client_type",
                (row, index) -> new Attempt(row.getObject("id", UUID.class), row.getString("client_type")), AuthSecrets.hash(state), Timestamp.from(now))
                .stream().findFirst().orElse(null);
    }
    @Transactional
    public UUID member(KakaoLoginClient.Profile profile) {
        // Serialize the same provider identity across concurrent first logins, without merging by email.
        jdbc.execute("SELECT pg_advisory_xact_lock(" + (long) profile.subject().hashCode() + ")");
        UUID id = jdbc.query("SELECT member_id FROM member_identity WHERE provider = 'KAKAO' AND subject = ?",
                (row, index) -> row.getObject(1, UUID.class), profile.subject()).stream().findFirst().orElse(null);
        if (id == null) {
            id = UUID.randomUUID();
            jdbc.update("INSERT INTO member_account (id, nickname, image_url, email) VALUES (?, ?, ?, ?)", id, profile.nickname(), profile.imageUrl(), profile.email());
            jdbc.update("INSERT INTO member_identity (provider, subject, member_id) VALUES ('KAKAO', ?, ?)", profile.subject(), id);
        } else jdbc.update("UPDATE member_account SET nickname = ?, image_url = ?, email = ? WHERE id = ?", profile.nickname(), profile.imageUrl(), profile.email(), id);
        return id;
    }
    void ready(UUID attempt, UUID member, String code, Instant expiry) {
        jdbc.update("UPDATE member_login_attempt SET member_id = ?, exchange_hash = ?, expires_at = ? WHERE id = ?",
                member, AuthSecrets.hash(code), Timestamp.from(expiry), attempt);
    }
    @Transactional
    public Login exchange(String code, String verifier, Instant now) {
        return jdbc.query("DELETE FROM member_login_attempt WHERE exchange_hash = ? AND challenge = ? AND expires_at > ? RETURNING member_id, client_type",
                (row, index) -> new Login(row.getObject("member_id", UUID.class), row.getString("client_type")),
                AuthSecrets.hash(code), AuthSecrets.challenge(verifier), Timestamp.from(now)).stream().findFirst().orElse(null);
    }
    void session(UUID member, String token, Instant expiry) {
        jdbc.update("INSERT INTO member_session (token_hash, member_id, expires_at) VALUES (?, ?, ?)", AuthSecrets.hash(token), member, Timestamp.from(expiry));
    }
    Member me(String token, Instant now) {
        if (token == null || !token.matches("[A-Za-z0-9_-]{43}")) return null;
        return jdbc.query("SELECT m.id, m.nickname, m.image_url, m.email FROM member_session s JOIN member_account m ON s.member_id = m.id WHERE s.token_hash = ? AND s.expires_at > ?",
                (row, index) -> new Member(row.getObject("id", UUID.class), row.getString("nickname"), row.getString("image_url"), row.getString("email")), AuthSecrets.hash(token), Timestamp.from(now))
                .stream().findFirst().orElse(null);
    }
    void logout(String token) { if (token != null) jdbc.update("DELETE FROM member_session WHERE token_hash = ?", AuthSecrets.hash(token)); }
    @Scheduled(cron = "0 15 * * * *")
    public void cleanup() {
        jdbc.update("DELETE FROM member_login_attempt WHERE expires_at < CURRENT_TIMESTAMP");
        jdbc.update("DELETE FROM member_session WHERE expires_at < CURRENT_TIMESTAMP");
    }
    record Attempt(UUID id, String client) { }
    record Login(UUID memberId, String client) { }
    public record Member(UUID id, String nickname, String imageUrl, String email) { }
}

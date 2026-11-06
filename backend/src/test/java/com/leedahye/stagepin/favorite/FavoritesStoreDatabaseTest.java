package com.leedahye.stagepin.favorite;

import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;
import static org.assertj.core.api.Assertions.*;

@EnabledIfEnvironmentVariable(named = "GOODS_TEST_JDBC_URL", matches = ".+/stagepin_goods_test")
class FavoritesStoreDatabaseTest {
    static JdbcTemplate jdbc;
    static TransactionTemplate tx;
    static FavoritesStore store;
    static JsonMapper json = JsonMapper.builder().build();
    @BeforeAll static void setup() {
        String url = System.getenv("GOODS_TEST_JDBC_URL");
        var base = new DriverManagerDataSource(url, "goods_test", "goods_test");
        // Separate schema avoids colliding with the goods fixture in the same disposable CI database.
        new JdbcTemplate(base).execute("CREATE SCHEMA favorites_test");
        var source = new DriverManagerDataSource(url + "?currentSchema=favorites_test", "goods_test", "goods_test");
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V6__create_member_auth.sql"),
                new ClassPathResource("db/migration/V9__create_member_favorites.sql")).execute(source);
        jdbc = new JdbcTemplate(source);
        tx = new TransactionTemplate(new DataSourceTransactionManager(source));
        store = new FavoritesStore(jdbc, json);
    }
    UUID member() {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO member_account(id,nickname) VALUES (?,?)", id, "test");
        return id;
    }
    FavoritesStore.Change artist() {
        return new FavoritesStore.Change("ARTIST", "mbid:day6", true, json.readTree(FavoritesStoreTest.ARTIST));
    }
    @Test void persistsAcrossRepositoryReloadAndIsolatesMembersAndIdempotentRemoval() {
        UUID a = member(), b = member();
        tx.execute(status -> store.change(a, artist()));
        tx.execute(status -> store.change(a, artist()));
        assertThat(new FavoritesStore(jdbc, json).list(a).artists()).hasSize(1);
        assertThat(store.list(b).artists()).isEmpty();
        tx.execute(status -> store.change(b, new FavoritesStore.Change("ARTIST", "mbid:day6", false, null)));
        assertThat(store.list(a).artists()).hasSize(1);
        tx.execute(status -> store.change(a, new FavoritesStore.Change("ARTIST", "mbid:day6", false, null)));
        assertThat(store.list(a).artists()).isEmpty();
    }
    @Test void importPreservesExistingSnapshotAndRollsBackEntireBatchOnQuota() {
        UUID owner = member();
        tx.execute(status -> store.change(owner, artist()));
        var older = new FavoritesStore.Change("ARTIST", "mbid:day6", true,
                json.readTree(FavoritesStoreTest.ARTIST.replace("band", "older")));
        tx.execute(status -> store.merge(owner, List.of(older, older)));
        assertThat(store.list(owner).artists().getFirst().path("description").asString()).isEqualTo("band");
        for (int i = 0; i < 199; i++) jdbc.update("INSERT INTO member_favorite(member_id,kind,target_id,snapshot) VALUES (?,'ARTIST',?,?::jsonb)",
                owner, "fixture" + i, FavoritesStoreTest.ARTIST.replace("mbid:day6", "fixture" + i));
        var extra = new FavoritesStore.Change("ARTIST", "extra", true,
                json.readTree(FavoritesStoreTest.ARTIST.replace("mbid:day6", "extra")));
        assertThatThrownBy(() -> tx.execute(status -> store.merge(owner, List.of(extra))))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        assertThat(store.list(owner).artists()).hasSize(200);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM member_favorite WHERE target_id='extra'", Integer.class)).isZero();
    }
    @Test void concertSnapshotAndMemberForeignKeySurviveReloadAndCascade() {
        UUID owner = member();
        var concert = new FavoritesStore.Change("CONCERT", "00000000-0000-0000-0000-000000000123", true,
                json.readTree(FavoritesStoreTest.CONCERT));
        tx.execute(status -> store.change(owner, concert));
        assertThat(new FavoritesStore(jdbc, json).list(owner).concerts().getFirst().path("venue").path("name").asString())
                .isEqualTo("Fixture venue");
        jdbc.update("DELETE FROM member_account WHERE id = ?", owner);
        assertThat(store.list(owner).concerts()).isEmpty();
    }
}

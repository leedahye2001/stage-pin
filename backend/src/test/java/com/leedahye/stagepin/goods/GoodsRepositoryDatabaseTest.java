package com.leedahye.stagepin.goods;

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
import static org.assertj.core.api.Assertions.*;

@EnabledIfEnvironmentVariable(named = "GOODS_TEST_JDBC_URL", matches = ".+/stagepin_goods_test")
class GoodsRepositoryDatabaseTest {
    static JdbcTemplate jdbc;
    static GoodsRepository repository;
    static TransactionTemplate tx;
    @BeforeAll
    static void setup() {
        var source = new DriverManagerDataSource(System.getenv("GOODS_TEST_JDBC_URL"), "goods_test", "goods_test");
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V6__create_member_auth.sql"),
                new ClassPathResource("db/migration/V7__add_member_email.sql"),
                new ClassPathResource("db/migration/V8__create_goods_listings.sql")).execute(source);
        jdbc = new JdbcTemplate(source);
        repository = new GoodsRepository(jdbc);
        tx = new TransactionTemplate(new DataSourceTransactionManager(source));
    }

    @Test
    void newRepositoryCanReloadListingPhotosOwnerAndIdempotentRequests() throws Exception {
        UUID owner = member(), other = member();
        var data = GoodsServiceTest.sale().validated();
        var photo = new GoodsPhotoProcessor().process(GoodsServiceTest.photo());
        var saved = tx.execute(status -> repository.create(owner, data, List.of(photo)));
        var retry = tx.execute(status -> repository.create(owner, data, List.of(photo)));
        assertThat(retry.id()).isEqualTo(saved.id());
        var fresh = new GoodsRepository(jdbc);
        var restored = fresh.find(saved.id());
        assertThat(restored.price()).isEqualTo(12000L);
        assertThat(restored.conditionCode()).isEqualTo("OPENED_UNUSED");
        assertThat(restored.ownerId()).isEqualTo(owner);
        assertThat(restored.photos()).hasSize(1);
        assertThat(fresh.photo(restored.photos().getFirst().id())).isEqualTo(photo.content());
        assertThat(fresh.list(owner, 24, 0)).extracting(GoodsResponse::id).contains(saved.id());
        assertThat(fresh.list(other, 24, 0)).isEmpty();
    }

    @Test
    void photoFailureRollsBackListingAndEveryPhoto() throws Exception {
        UUID owner = member();
        var good = new GoodsPhotoProcessor().process(GoodsServiceTest.photo());
        var bad = new GoodsPhotoProcessor.Photo(new byte[]{1}, 0, 1);
        assertThatThrownBy(() -> tx.execute(status -> repository.create(owner, GoodsServiceTest.sale().validated(), List.of(good, bad))))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        assertThat(repository.list(owner, 24, 0)).isEmpty();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM goods_photo p LEFT JOIN goods_listing g ON g.id = p.listing_id WHERE g.id IS NULL", Integer.class)).isZero();
    }

    @Test
    void exchangeKeepsPhotoOrderAndNullPriceAfterReload() throws Exception {
        UUID owner = member();
        var data = new GoodsRequest(UUID.randomUUID(), "DAY6", "교환 포카", "EXCHANGE", null, "원필 포카",
                "USED_GOOD", "실물 상태 확인", true, true, "공연장").validated();
        var photo = new GoodsPhotoProcessor().process(GoodsServiceTest.photo());
        var saved = tx.execute(status -> repository.create(owner, data, java.util.Collections.nCopies(5, photo)));
        assertThat(repository.find(saved.id()).photos()).extracting(GoodsResponse.Photo::id)
                .containsExactlyElementsOf(saved.photos().stream().map(GoodsResponse.Photo::id).toList());
        assertThat(saved.photos()).hasSize(5);
        assertThat(saved.price()).isNull();
        assertThat(saved.wanted()).isEqualTo("원필 포카");
        assertThat(saved.event()).isEqualTo("공연장");
        assertThat(saved.onsite()).isTrue();
    }

    @Test
    void databaseAlsoRejectsNullSalePrice() {
        UUID owner = member();
        assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO goods_listing (id, owner_id, request_id, artist, title, kind, condition_code, onsite, delivery)
                VALUES (?, ?, ?, 'DAY6', '포카', 'SALE', 'SEALED', false, true)
                """, UUID.randomUUID(), owner, UUID.randomUUID()))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
    }

    private UUID member() {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO member_account (id, nickname) VALUES (?, '테스트 팬')", id);
        return id;
    }
}

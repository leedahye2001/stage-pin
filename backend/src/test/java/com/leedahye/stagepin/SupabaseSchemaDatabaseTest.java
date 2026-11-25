package com.leedahye.stagepin;

import javax.sql.DataSource;
import jakarta.persistence.EntityManagerFactory;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.jdbc.core.JdbcTemplate;
import static org.assertj.core.api.Assertions.assertThat;

@EnabledIfEnvironmentVariable(named = "GOODS_TEST_JDBC_URL", matches = ".+/stagepin_goods_test")
class SupabaseSchemaDatabaseTest {
    @Test
    void migratesAndValidatesInPrivateSchemaAndKeepsJdbcAndJpaInSameSchema() {
        // Disposable local PostgreSQL has no TLS; only this test overrides the production URL.
        try (var context = new SpringApplicationBuilder(StagePinApiApplication.class).profiles("supabase").run(
                "--server.port=0", "--spring.datasource.url=" + System.getenv("GOODS_TEST_JDBC_URL"),
                "--spring.datasource.username=goods_test", "--spring.datasource.password=goods_test")) {
            var jdbc = new JdbcTemplate(context.getBean(DataSource.class));
            assertThat(jdbc.queryForObject("SELECT current_schema()", String.class)).isEqualTo("stagepin");
            assertThat(jdbc.queryForObject("SELECT count(*) FROM stagepin.flyway_schema_history WHERE success", Integer.class))
                    .isGreaterThanOrEqualTo(9);
            assertThat(jdbc.queryForObject("SELECT to_regclass('goods_listing')::text", String.class)).isEqualTo("goods_listing");
            assertThat(jdbc.queryForObject("SELECT count(*) FROM member_favorite", Integer.class)).isZero();
            try (var entityManager = context.getBean(EntityManagerFactory.class).createEntityManager()) {
                assertThat(((Number) entityManager.createNativeQuery("SELECT count(*) FROM artist").getSingleResult()).intValue())
                        .isPositive();
            }
            assertThat(context.getBean(Flyway.class).migrate().migrationsExecuted).isZero();
        }
    }
}

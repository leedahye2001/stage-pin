package com.leedahye.stagepin;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.io.ClassPathResource;
import static org.assertj.core.api.Assertions.assertThat;

class SupabaseConfigurationTest {
    @Test
    void isolatesApplicationSchemaAndRequiresEncryptedSessionPoolerConnection() throws Exception {
        var environment = new StandardEnvironment();
        environment.getPropertySources().addFirst(new MapPropertySource("fixture", Map.of(
                "DB_HOST", "fixture.pooler.supabase.com", "DB_USERNAME", "postgres.fixture",
                "DB_PASSWORD", "fixture-only", "DB_PORT", "5432", "DB_NAME", "postgres")));
        var loader = new YamlPropertySourceLoader();
        loader.load("supabase", new ClassPathResource("application-supabase.yml"))
                .forEach(source -> environment.getPropertySources().addLast(source));
        loader.load("base", new ClassPathResource("application.yml"))
                .forEach(source -> environment.getPropertySources().addLast(source));

        assertThat(environment.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:postgresql://fixture.pooler.supabase.com:5432/postgres?sslmode=require");
        assertThat(environment.getProperty("spring.datasource.hikari.schema")).isEqualTo("stagepin");
        assertThat(environment.getProperty("spring.jpa.properties.hibernate.default_schema")).isEqualTo("stagepin");
        assertThat(environment.getProperty("spring.flyway.default-schema")).isEqualTo("stagepin");
        assertThat(environment.getProperty("spring.flyway.schemas")).isEqualTo("stagepin");
        assertThat(environment.getProperty("spring.jpa.hibernate.ddl-auto")).isEqualTo("validate");
        assertThat(environment.getProperty("spring.datasource.hikari.maximum-pool-size")).isEqualTo("3");
    }
}

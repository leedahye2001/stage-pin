package com.leedahye.stagepin.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/v1/artists/**",
                                "/api/v1/concerts/**",
                                "/api/v1/ticket-openings",
                                "/api/v1/admin/ticket-openings",
                                "/api/v1/admin/notices/**",
                                "/api/v1/search/**",
                                "/api/v1/auth/**",
                                "/actuator/health").permitAll()
                        .anyRequest().denyAll())
                .build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${APP_CORS_ALLOWED_ORIGIN_PATTERNS:http://localhost:*}") String allowedOriginPatterns,
            @Value("${STAGEPIN_WEB_URL:http://localhost:8081}") String webUrl) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(allowedOriginPatterns.split(",")));
        configuration.setAllowedMethods(List.of("GET", "POST"));
        configuration.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration auth = new CorsConfiguration();
        auth.setAllowedOrigins(List.of(webUrl.replaceAll("/+$", "")));
        auth.setAllowedMethods(List.of("GET", "POST"));
        auth.setAllowedHeaders(List.of("Content-Type", "Authorization"));
        auth.setAllowCredentials(true);
        source.registerCorsConfiguration("/api/v1/auth/**", auth);
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}

package com.leedahye.stagepin.search;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.leedahye.stagepin.search.NaverSearchResponse.Item;

@Component
public class NaverSearchClient {
    private static final Logger log = LoggerFactory.getLogger(NaverSearchClient.class);
    private static final Duration CACHE_TTL = Duration.ofMinutes(30);

    private final RestClient restClient;
    private final String clientId;
    private final String clientSecret;
    private final Map<String, NaverSearchResponse> cache = new HashMap<>();
    private final Map<String, Instant> cacheExpiresAt = new HashMap<>();

    public NaverSearchClient(
            @Value("${naver.client-id:}") String clientId,
            @Value("${naver.client-secret:}") String clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.restClient = RestClient.builder()
                .baseUrl("https://naverapihub.apigw.ntruss.com")
                .build();
    }

    public synchronized NaverSearchResponse search(String artist) {
        if (clientId.isBlank() || clientSecret.isBlank()) {
            return new NaverSearchResponse(false, List.of());
        }

        String cacheKey = artist.trim().toLowerCase(Locale.ROOT);
        if (Instant.now().isBefore(cacheExpiresAt.getOrDefault(cacheKey, Instant.EPOCH))) {
            return cache.get(cacheKey);
        }

        try {
            SearchPayload payload = restClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/search/v1/webkr")
                            .queryParam("query", artist.trim() + " 공연 콘서트 팬미팅 예매")
                            .queryParam("display", 5)
                            .queryParam("start", 1)
                            .queryParam("format", "json")
                            .build())
                    .header("X-NCP-APIGW-API-KEY-ID", clientId)
                    .header("X-NCP-APIGW-API-KEY", clientSecret)
                    .retrieve()
                    .body(SearchPayload.class);
            List<Item> items = payload == null || payload.items() == null
                    ? List.of()
                    : payload.items().stream()
                            .map(item -> new Item(item.title(), item.link(), item.description()))
                            .toList();
            NaverSearchResponse response = new NaverSearchResponse(true, items);
            cache.put(cacheKey, response);
            cacheExpiresAt.put(cacheKey, Instant.now().plus(CACHE_TTL));
            return response;
        } catch (RuntimeException exception) {
            log.warn("NAVER search unavailable for artist: {}", artist, exception);
            return new NaverSearchResponse(true, List.of());
        }
    }

    private record SearchPayload(List<SearchItem> items) {
    }

    private record SearchItem(String title, String link, String description) {
    }
}

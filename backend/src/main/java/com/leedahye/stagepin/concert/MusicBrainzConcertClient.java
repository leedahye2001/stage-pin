package com.leedahye.stagepin.concert;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.leedahye.stagepin.concert.ConcertResponse.ArtistSummary;
import com.leedahye.stagepin.concert.ConcertResponse.VenueSummary;

import tools.jackson.databind.JsonNode;

@Component
public class MusicBrainzConcertClient {
    private static final Duration CACHE_TTL = Duration.ofMinutes(30);
    private static final Duration REQUEST_INTERVAL = Duration.ofMillis(1_100);
    private static final int RESULT_LIMIT = 3;

    private final RestClient restClient;
    private List<ConcertResponse> cachedConcerts = List.of();
    private Instant cacheExpiresAt = Instant.EPOCH;
    private long lastRequestAtNanos;

    public MusicBrainzConcertClient() {
        restClient = RestClient.builder()
                .baseUrl("https://musicbrainz.org/ws/2")
                .defaultHeader(HttpHeaders.USER_AGENT, "StagePin/0.1 (https://github.com/leedahye2001/stage-pin)")
                .build();
    }

    public synchronized List<ConcertResponse> findUpcoming(Instant from) {
        if (Instant.now().isBefore(cacheExpiresAt)) {
            return cachedConcerts;
        }

        LocalDate startDate = LocalDate.ofInstant(from, ZoneOffset.UTC);
        LocalDate endDate = startDate.plusYears(1);
        String query = "begin:[%s TO %s] AND type:Concert AND place:*".formatted(startDate, endDate);
        JsonNode searchResult = get("/event/", query);

        List<JsonNode> events = new ArrayList<>();
        searchResult.path("events").forEach(events::add);
        events.sort(Comparator.comparing(event -> event.path("life-span").path("begin").asText("9999-12-31")));

        List<ConcertResponse> concerts = new ArrayList<>();
        Set<String> artistsSeen = new HashSet<>();
        for (JsonNode event : events) {
            JsonNode placeRelation = relation(event, "held at");
            JsonNode artistRelation = relation(event, "main performer");
            if (placeRelation == null || artistRelation == null) {
                continue;
            }

            String artistId = artistRelation.path("artist").path("id").asText();
            if (!artistsSeen.add(artistId)) {
                continue;
            }

            String placeId = placeRelation.path("place").path("id").asText();
            JsonNode place = get("/place/" + placeId, null);
            if (!place.path("coordinates").hasNonNull("latitude")
                    || !place.path("coordinates").hasNonNull("longitude")) {
                continue;
            }

            concerts.add(toConcert(event, place, Instant.now()));
            if (concerts.size() == RESULT_LIMIT) {
                break;
            }
        }

        cachedConcerts = List.copyOf(concerts);
        cacheExpiresAt = Instant.now().plus(CACHE_TTL);
        return cachedConcerts;
    }

    public ConcertResponse findById(UUID id, Instant from) {
        return findUpcoming(from).stream()
                .filter(concert -> concert.id().equals(id))
                .findFirst()
                .orElse(null);
    }

    ConcertResponse toConcert(JsonNode event, JsonNode place, Instant verifiedAt) {
        LinkedHashMap<UUID, ArtistSummary> artists = new LinkedHashMap<>();
        for (JsonNode relation : event.path("relations")) {
            JsonNode artist = relation.path("artist");
            if (artist.hasNonNull("id") && artist.hasNonNull("name")) {
                UUID artistId = UUID.fromString(artist.path("id").asText());
                artists.putIfAbsent(artistId, new ArtistSummary(artistId, artist.path("name").asText(), null));
            }
        }

        LocalDate eventDate = LocalDate.parse(event.path("life-span").path("begin").asText());
        Instant startsAt = eventDate.atTime(LocalTime.NOON).toInstant(ZoneOffset.UTC);
        UUID placeId = UUID.fromString(place.path("id").asText());
        String city = place.path("area").path("name").asText("지역 미정");

        return new ConcertResponse(
                UUID.fromString(event.path("id").asText()),
                event.path("name").asText(),
                List.copyOf(artists.values()),
                new VenueSummary(
                        placeId,
                        place.path("name").asText(),
                        city,
                        "",
                        place.path("address").asText(null),
                        "UTC",
                        place.path("coordinates").path("latitude").asDouble(),
                        place.path("coordinates").path("longitude").asDouble()),
                startsAt,
                null,
                ConcertStatus.UPCOMING,
                null,
                "https://musicbrainz.org/event/" + event.path("id").asText(),
                "MUSICBRAINZ_CC0",
                verifiedAt,
                List.of());
    }

    private JsonNode get(String path, String query) {
        respectRateLimit();
        JsonNode response = restClient.get()
                .uri(uriBuilder -> {
                    uriBuilder.path(path).queryParam("fmt", "json");
                    if (query != null) {
                        uriBuilder.queryParam("query", query).queryParam("limit", 25);
                    }
                    return uriBuilder.build();
                })
                .retrieve()
                .body(JsonNode.class);
        lastRequestAtNanos = System.nanoTime();
        if (response == null) {
            throw new IllegalStateException("MusicBrainz returned an empty response");
        }
        return response;
    }

    private void respectRateLimit() {
        long waitNanos = REQUEST_INTERVAL.toNanos() - (System.nanoTime() - lastRequestAtNanos);
        if (lastRequestAtNanos == 0 || waitNanos <= 0) {
            return;
        }
        try {
            Thread.sleep(Duration.ofNanos(waitNanos));
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while respecting MusicBrainz rate limit", exception);
        }
    }

    private JsonNode relation(JsonNode event, String type) {
        for (JsonNode relation : event.path("relations")) {
            if (type.equals(relation.path("type").asText())) {
                return relation;
            }
        }
        return null;
    }
}

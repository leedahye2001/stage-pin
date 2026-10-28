package com.leedahye.stagepin.artist;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
public class SpotifyArtistClient {
    private final ObjectMapper mapper;
    private final RestClient http;
    private final String clientId;
    private final String clientSecret;
    private String token;
    private Instant tokenExpiresAt = Instant.EPOCH;
    private Instant retryAt = Instant.EPOCH;

    @Autowired
    public SpotifyArtistClient(ObjectMapper mapper,
            @Value("${SPOTIFY_CLIENT_ID:}") String clientId,
            @Value("${SPOTIFY_CLIENT_SECRET:}") String clientSecret) {
        this(mapper, clientId, clientSecret, builder());
    }

    SpotifyArtistClient(ObjectMapper mapper, String clientId, String clientSecret, RestClient.Builder builder) {
        this.mapper = mapper;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.http = builder.baseUrl("https://api.spotify.com").build();
    }

    public boolean configured() {
        return !clientId.isBlank() && !clientSecret.isBlank();
    }

    public synchronized List<ArtistSearchResponse> search(String query) {
        if (!configured() || query.isBlank()) return List.of();
        if (Instant.now().isBefore(retryAt)) throw new RestClientException("Spotify request cooldown");
        try {
            return searchWithToken(query);
        } catch (HttpClientErrorException.Unauthorized exception) {
            // A revoked/expired token is refreshed once, never in an unbounded retry loop.
            token = null;
            return searchWithToken(query);
        }
    }

    private List<ArtistSearchResponse> searchWithToken(String query) {
        try {
            byte[] body = http.get().uri(uri -> uri.path("/v1/search")
                            .queryParam("q", query).queryParam("type", "artist")
                            .queryParam("limit", 5).build())
                    .headers(headers -> headers.setBearerAuth(accessToken()))
                    .retrieve().body(byte[].class);
            JsonNode root = read(body);
            if (!root.path("artists").path("items").isArray()) {
                throw new RestClientException("Invalid Spotify artist response");
            }
            List<ArtistSearchResponse> results = new ArrayList<>();
            for (JsonNode artist : root.path("artists").path("items")) {
                String id = artist.path("id").asText();
                String name = artist.path("name").asText();
                if (!id.matches("[A-Za-z0-9]{22}") || name.isBlank()) continue;
                String image = null;
                for (JsonNode candidate : artist.path("images")) {
                    String url = candidate.path("url").asText();
                    if (url.startsWith("https://i.scdn.co/image/")) {
                        image = url;
                        break;
                    }
                }
                List<String> genres = new ArrayList<>();
                for (JsonNode genre : artist.path("genres")) genres.add(genre.asText());
                results.add(new ArtistSearchResponse("spotify:" + id, name, name,
                        String.join(" · ", genres), List.of(name), image,
                        "https://open.spotify.com/artist/" + id, "Spotify", "Spotify"));
            }
            return List.copyOf(results);
        } catch (HttpClientErrorException.TooManyRequests exception) {
            long seconds = 60;
            try {
                if (exception.getResponseHeaders() != null) {
                    seconds = Long.parseLong(exception.getResponseHeaders().getFirst("Retry-After"));
                }
            } catch (NumberFormatException ignored) { }
            retryAt = Instant.now().plusSeconds(Math.max(1, Math.min(seconds, 86400)));
            throw new RestClientException("Spotify rate limit reached");
        }
    }

    private String accessToken() {
        if (token != null && Instant.now().isBefore(tokenExpiresAt)) return token;
        JsonNode response = read(http.post().uri("https://accounts.spotify.com/api/token")
                .headers(headers -> headers.setBasicAuth(clientId, clientSecret))
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body("grant_type=client_credentials").retrieve().body(byte[].class));
        String value = response.path("access_token").asText();
        long seconds = response.path("expires_in").asLong();
        if (value.isBlank() || seconds <= 0) throw new RestClientException("Invalid Spotify token response");
        token = value;
        tokenExpiresAt = Instant.now().plusSeconds(Math.max(0, seconds - 30));
        return token;
    }

    private JsonNode read(byte[] body) {
        try {
            return mapper.readTree(body);
        } catch (RuntimeException exception) {
            throw new RestClientException("Invalid Spotify response");
        }
    }

    private static RestClient.Builder builder() {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(4));
        factory.setReadTimeout(Duration.ofSeconds(8));
        return RestClient.builder().requestFactory(factory);
    }
}

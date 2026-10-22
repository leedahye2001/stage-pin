package com.leedahye.stagepin.artist;

import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
public class ArtistCatalogClient {
    private static final Logger log = LoggerFactory.getLogger(ArtistCatalogClient.class);
    private static final Duration CACHE_TTL = Duration.ofHours(6);
    private static final int RESULT_LIMIT = 5;
    private static final String USER_AGENT = "StagePin/1.0 (https://github.com/leedahye2001/stage-pin)";

    private final ObjectMapper objectMapper;
    private final RestClient musicBrainz;
    private final RestClient wikidata;
    private final RestClient commons;
    private final Map<String, CacheEntry> cache = new HashMap<>();
    private Instant lastMusicBrainzRequest = Instant.EPOCH;

    public ArtistCatalogClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.musicBrainz = client("https://musicbrainz.org");
        this.wikidata = client("https://query.wikidata.org");
        this.commons = client("https://commons.wikimedia.org");
    }

    public synchronized List<ArtistSearchResponse> search(String query) {
        String keyword = query.trim();
        if (keyword.length() < 2) {
            return List.of();
        }
        String cacheKey = keyword.toLowerCase(Locale.ROOT);
        CacheEntry cached = cache.get(cacheKey);
        if (cached != null && Instant.now().isBefore(cached.expiresAt())) {
            return cached.artists();
        }

        List<Candidate> candidates = searchMusicBrainz(keyword);
        if (candidates.stream().noneMatch(candidate -> candidate.matches(keyword))) {
            String spaced = splitTrailingLatinLetter(keyword);
            if (!spaced.equals(keyword)) {
                candidates = merge(candidates, searchMusicBrainz(spaced));
            }
        }
        candidates.sort((left, right) -> Integer.compare(right.rank(keyword), left.rank(keyword)));
        candidates = candidates.stream().limit(RESULT_LIMIT).toList();

        Map<String, CommonsImage> images = loadImages(candidates);
        List<ArtistSearchResponse> artists = candidates.stream()
                .map(candidate -> candidate.toResponse(images.get(candidate.id()), keyword))
                .toList();
        cache.put(cacheKey, new CacheEntry(artists, Instant.now().plus(CACHE_TTL)));
        return artists;
    }

    private List<Candidate> searchMusicBrainz(String query) {
        respectMusicBrainzRateLimit();
        byte[] body = musicBrainz.get()
                .uri(uriBuilder -> uriBuilder.path("/ws/2/artist/")
                        .queryParam("query", query)
                        .queryParam("fmt", "json")
                        .queryParam("limit", 10)
                        .build())
                .retrieve()
                .body(byte[].class);
        lastMusicBrainzRequest = Instant.now();
        return parseMusicBrainz(body);
    }

    List<Candidate> parseMusicBrainz(byte[] body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            List<Candidate> candidates = new ArrayList<>();
            for (JsonNode artist : root.path("artists")) {
                String name = artist.path("name").asText();
                if (name.isBlank() || "[no artist]".equals(name)) {
                    continue;
                }
                LinkedHashSet<String> aliases = new LinkedHashSet<>();
                aliases.add(name);
                for (JsonNode alias : artist.path("aliases")) {
                    String aliasName = alias.path("name").asText();
                    if (!aliasName.isBlank()) {
                        aliases.add(aliasName);
                    }
                }
                String description = artist.path("disambiguation").asText();
                String country = artist.path("country").asText();
                if (!country.isBlank()) {
                    description = description.isBlank() ? country : description + " · " + country;
                }
                candidates.add(new Candidate(
                        artist.path("id").asText(),
                        name,
                        description,
                        List.copyOf(aliases)));
            }
            return candidates;
        } catch (Exception exception) {
            throw new IllegalArgumentException("Invalid MusicBrainz response", exception);
        }
    }

    private Map<String, CommonsImage> loadImages(List<Candidate> candidates) {
        if (candidates.isEmpty()) {
            return Map.of();
        }
        try {
            String values = candidates.stream()
                    .map(candidate -> "\"" + candidate.id() + "\"")
                    .reduce("", (left, right) -> left + " " + right);
            String sparql = "SELECT ?mbid ?image WHERE { VALUES ?mbid {" + values
                    + " } ?item wdt:P434 ?mbid. OPTIONAL { ?item wdt:P18 ?image. } }";
            byte[] response = wikidata.get()
                    .uri(URI.create("https://query.wikidata.org/sparql?query="
                            + URLEncoder.encode(sparql, StandardCharsets.UTF_8)
                            + "&format=json"))
                    .retrieve()
                    .body(byte[].class);
            Map<String, String> filenames = parseWikidataImages(response);
            return loadCommonsMetadata(filenames);
        } catch (RuntimeException exception) {
            log.warn("Unable to enrich artist search with Wikimedia images", exception);
            return Map.of();
        }
    }

    Map<String, String> parseWikidataImages(byte[] body) {
        try {
            Map<String, String> filenames = new LinkedHashMap<>();
            JsonNode bindings = objectMapper.readTree(body).path("results").path("bindings");
            for (JsonNode binding : bindings) {
                String mbid = binding.path("mbid").path("value").asText();
                String image = binding.path("image").path("value").asText();
                int marker = image.indexOf("Special:FilePath/");
                if (!mbid.isBlank() && marker >= 0) {
                    filenames.putIfAbsent(mbid, URLDecoder.decode(
                            image.substring(marker + "Special:FilePath/".length()),
                            StandardCharsets.UTF_8));
                }
            }
            return filenames;
        } catch (Exception exception) {
            throw new IllegalArgumentException("Invalid Wikidata response", exception);
        }
    }

    private Map<String, CommonsImage> loadCommonsMetadata(Map<String, String> filenames) {
        if (filenames.isEmpty()) {
            return Map.of();
        }
        String titles = filenames.values().stream()
                .map(filename -> "File:" + filename)
                .reduce((left, right) -> left + "|" + right)
                .orElse("");
        byte[] response = commons.get()
                .uri(uriBuilder -> uriBuilder.path("/w/api.php")
                        .queryParam("action", "query")
                        .queryParam("prop", "imageinfo")
                        .queryParam("iiprop", "url|extmetadata")
                        .queryParam("iiurlwidth", 200)
                        .queryParam("titles", titles)
                        .queryParam("format", "json")
                        .build())
                .retrieve()
                .body(byte[].class);
        Map<String, CommonsImage> byFilename = parseCommonsImages(response);
        Map<String, CommonsImage> byArtist = new HashMap<>();
        filenames.forEach((artistId, filename) -> {
            CommonsImage image = byFilename.get(filename.replace('_', ' '));
            if (image != null) {
                byArtist.put(artistId, image);
            }
        });
        return byArtist;
    }

    Map<String, CommonsImage> parseCommonsImages(byte[] body) {
        try {
            Map<String, CommonsImage> images = new HashMap<>();
            JsonNode pages = objectMapper.readTree(body).path("query").path("pages");
            pages.properties().forEach(entry -> {
                JsonNode page = entry.getValue();
                JsonNode info = page.path("imageinfo").path(0);
                String filename = page.path("title").asText().replaceFirst("^File:", "");
                String imageUrl = info.path("thumburl").asText(info.path("url").asText());
                if (!filename.isBlank() && !imageUrl.isBlank()) {
                    JsonNode metadata = info.path("extmetadata");
                    images.put(filename, new CommonsImage(
                            imageUrl,
                            info.path("descriptionurl").asText(),
                            stripHtml(metadata.path("Artist").path("value").asText()),
                            metadata.path("LicenseShortName").path("value").asText()));
                }
            });
            return images;
        } catch (Exception exception) {
            throw new IllegalArgumentException("Invalid Wikimedia Commons response", exception);
        }
    }

    private void respectMusicBrainzRateLimit() {
        long waitMillis = 1_050 - Duration.between(lastMusicBrainzRequest, Instant.now()).toMillis();
        if (waitMillis <= 0) {
            return;
        }
        try {
            Thread.sleep(waitMillis);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Artist search interrupted", exception);
        }
    }

    private RestClient client(String baseUrl) {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("User-Agent", USER_AGENT)
                .build();
    }

    private List<Candidate> merge(List<Candidate> first, List<Candidate> second) {
        Map<String, Candidate> merged = new LinkedHashMap<>();
        first.forEach(candidate -> merged.put(candidate.id(), candidate));
        second.forEach(candidate -> merged.putIfAbsent(candidate.id(), candidate));
        return new ArrayList<>(merged.values());
    }

    private String splitTrailingLatinLetter(String value) {
        if (value.matches("[A-Za-z]{5,}")) {
            return value.substring(0, value.length() - 1) + " " + value.charAt(value.length() - 1);
        }
        return value;
    }

    private String stripHtml(String value) {
        return value.replaceAll("<[^>]+>", "").replace("&amp;", "&").trim();
    }

    record Candidate(String id, String name, String description, List<String> aliases) {
        boolean matches(String query) {
            String normalizedQuery = normalize(query);
            return aliases.stream().map(Candidate::normalize).anyMatch(normalizedQuery::equals);
        }

        int rank(String query) {
            int score = matches(query) ? 100 : 0;
            if (description.equals("KR") || description.endsWith(" · KR")) {
                score += 20;
            }
            if (aliases.size() > 1) {
                score += 5;
            }
            return score;
        }

        ArtistSearchResponse toResponse(CommonsImage image, String query) {
            String normalizedQuery = normalize(query);
            String matchedAlias = aliases.stream()
                    .filter(alias -> normalize(alias).equals(normalizedQuery))
                    .findFirst()
                    .orElse(name);
            String searchName = containsLatin(name) ? name
                    : aliases.stream().filter(Candidate::containsLatin).findFirst().orElse(matchedAlias);
            return new ArtistSearchResponse(
                    id,
                    name,
                    searchName,
                    description,
                    aliases,
                    image == null ? null : image.url(),
                    image == null ? null : image.pageUrl(),
                    image == null ? null : image.attribution(),
                    image == null ? null : image.license());
        }

        private static String normalize(String value) {
            return value.toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]", "");
        }

        private static boolean containsLatin(String value) {
            return value.matches(".*[A-Za-z].*");
        }
    }

    record CommonsImage(String url, String pageUrl, String attribution, String license) {
    }

    private record CacheEntry(List<ArtistSearchResponse> artists, Instant expiresAt) {
    }
}

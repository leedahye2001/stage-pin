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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.util.HtmlUtils;
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
    private final SpotifyArtistClient spotify;
    private final Map<String, CacheEntry> cache = new HashMap<>();
    private Instant lastMusicBrainzRequest = Instant.EPOCH;

    public ArtistCatalogClient(ObjectMapper objectMapper) {
        this(objectMapper, new SpotifyArtistClient(objectMapper, "", ""));
    }

    @Autowired
    public ArtistCatalogClient(ObjectMapper objectMapper, SpotifyArtistClient spotify) {
        this.objectMapper = objectMapper;
        this.spotify = spotify;
        this.musicBrainz = client("https://musicbrainz.org");
        this.wikidata = client("https://query.wikidata.org");
        this.commons = client("https://commons.wikimedia.org");
    }

    public synchronized List<ArtistSearchResponse> search(String query) {
        String keyword = query.trim();
        if (keyword.isEmpty()) {
            return List.of();
        }
        String cacheKey = keyword.toLowerCase(Locale.ROOT);
        CacheEntry cached = cache.get(cacheKey);
        if (cached != null && Instant.now().isBefore(cached.expiresAt())) {
            return cached.artists();
        }

        List<Candidate> candidates;
        try {
            candidates = searchMusicBrainz(keyword);
        } catch (RestClientException exception) {
            if (!spotify.configured()) throw exception;
            candidates = new ArrayList<>();
        }
        if (candidates.stream().noneMatch(candidate -> candidate.matches(keyword))) {
            String spaced = splitTrailingLatinLetter(keyword);
            if (!spaced.equals(keyword)) {
                try {
                    candidates = merge(candidates, searchMusicBrainz(spaced));
                } catch (RestClientException exception) {
                    if (!spotify.configured()) throw exception;
                }
            }
        }
        candidates.sort((left, right) -> Integer.compare(right.rank(keyword), left.rank(keyword)));
        candidates = candidates.stream().limit(RESULT_LIMIT).toList();

        if (spotify.configured()) {
            String spotifyQuery = candidates.stream().filter(candidate -> candidate.matches(keyword))
                    .findFirst().map(candidate -> candidate.toResponse(null, keyword).searchName()).orElse(keyword);
            List<ArtistSearchResponse> artists = matchSpotify(spotify.search(spotifyQuery), candidates, keyword);
            cache.put(cacheKey, new CacheEntry(artists, Instant.now().plus(Duration.ofHours(1))));
            return artists;
        }

        Map<String, CommonsImage> images = loadImages(candidates);
        List<ArtistSearchResponse> artists = candidates.stream()
                .map(candidate -> candidate.toResponse(images.get(candidate.id()), keyword))
                .toList();
        cache.put(cacheKey, new CacheEntry(artists, Instant.now().plus(CACHE_TTL)));
        return artists;
    }

    // Keep existing favorites and multilingual aliases when the catalog identity matches exactly.
    List<ArtistSearchResponse> matchSpotify(List<ArtistSearchResponse> results, List<Candidate> candidates, String query) {
        return results.stream().map(result -> {
            Candidate matched = candidates.stream().filter(candidate -> candidate.matches(result.name())).findFirst().orElse(null);
            if (matched == null) return result;
            return new ArtistSearchResponse(matched.id(), result.name(),
                    matched.toResponse(null, query).searchName(), result.description(), matched.aliases(),
                    result.imageUrl(), result.imagePageUrl(), result.imageAttribution(), result.imageLicense());
        }).toList();
    }

    private List<Candidate> searchMusicBrainz(String query) {
        respectMusicBrainzRateLimit();
        lastMusicBrainzRequest = Instant.now();
        byte[] body = musicBrainz.get()
                .uri(uriBuilder -> uriBuilder.path("/ws/2/artist/")
                        .queryParam("query", query)
                        .queryParam("fmt", "json")
                        .queryParam("limit", 10)
                        .build())
                .retrieve()
                .body(byte[].class);
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
                JsonNode metadata = info.path("extmetadata");
                String license = metadata.path("LicenseShortName").path("value").asText();
                String licenseUrl = metadata.path("LicenseUrl").path("value").asText();
                String author = stripHtml(metadata.path("Attribution").path("value").asText());
                if (author.isBlank()) {
                    author = stripHtml(metadata.path("Artist").path("value").asText());
                    String credit = stripHtml(metadata.path("Credit").path("value").asText());
                    if (!credit.isBlank() && !credit.equals(author)) author += " · " + credit;
                }
                String pageUrl = info.path("descriptionurl").asText();
                if (!filename.isBlank() && isWikimediaImage(imageUrl)
                        && pageUrl.startsWith("https://commons.wikimedia.org/wiki/File:")
                        && reusableLicense(license, licenseUrl)
                        && (!stripHtml(metadata.path("Attribution").path("value").asText()).isBlank()
                            || !stripHtml(metadata.path("Artist").path("value").asText()).isBlank()
                            || license.equals("CC0"))
                        && metadata.path("DeletionReason").path("value").asText().isBlank()) {
                    images.put(filename, new CommonsImage(
                            imageUrl,
                            pageUrl,
                            author,
                            license));
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
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(4));
        factory.setReadTimeout(Duration.ofSeconds(8));
        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
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
        return HtmlUtils.htmlUnescape(value.replaceAll("<[^>]+>", "")).trim();
    }

    private boolean isWikimediaImage(String url) {
        return url.startsWith("https://upload.wikimedia.org/") || url.startsWith("https://thumb.wikimedia.org/");
    }

    private boolean reusableLicense(String license, String url) {
        String secureUrl = url.replaceFirst("^http://", "https://");
        if (license.equals("CC0")) return secureUrl.matches("https://creativecommons\\.org/publicdomain/zero/1\\.0/?");
        if (!license.matches("CC BY(?:-SA)? [234]\\.0")) return false;
        String slug = license.startsWith("CC BY-SA") ? "by-sa" : "by";
        String version = license.substring(license.length() - 3);
        return secureUrl.matches("https://creativecommons\\.org/licenses/" + slug + "/" + version.replace(".", "\\.") + "(?:/(?:deed(?:\\.[a-zA-Z-]+)?)?)?");
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

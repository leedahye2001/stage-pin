package com.leedahye.stagepin.concert;

import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.xml.sax.InputSource;

import com.leedahye.stagepin.concert.ConcertResponse.ArtistSummary;
import com.leedahye.stagepin.concert.ConcertResponse.VenueSummary;

@Component
public class KopisConcertClient {
    private static final Logger log = LoggerFactory.getLogger(KopisConcertClient.class);
    private static final DateTimeFormatter KOPIS_DATE = DateTimeFormatter.ofPattern("yyyy.MM.dd");
    private static final DateTimeFormatter REQUEST_DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final Duration CACHE_TTL = Duration.ofMinutes(30);
    private static final int RESULT_LIMIT = 12;
    private static final int SEARCH_RESULT_LIMIT = 30;
    private static final LocalDate HISTORY_START = LocalDate.of(2014, 1, 1);

    private final RestClient restClient;
    private final String apiKey;
    private final Map<ConcertGenre, List<ConcertResponse>> cachedConcerts = new EnumMap<>(ConcertGenre.class);
    private final Map<ConcertGenre, Instant> cacheExpiresAt = new EnumMap<>(ConcertGenre.class);
    private final Map<String, List<ConcertResponse>> cachedSearches = new HashMap<>();
    private final Map<String, Instant> searchCacheExpiresAt = new HashMap<>();

    public KopisConcertClient(@Value("${kopis.api-key:}") String apiKey) {
        this.apiKey = apiKey;
        this.restClient = RestClient.builder()
                .baseUrl("https://kopis.or.kr/openApi/restful")
                .build();
    }

    public synchronized List<ConcertResponse> findUpcoming(Instant from, ConcertGenre genre) {
        if (apiKey.isBlank()) {
            return List.of();
        }
        if (Instant.now().isBefore(cacheExpiresAt.getOrDefault(genre, Instant.EPOCH))) {
            return cachedConcerts.getOrDefault(genre, List.of());
        }

        LocalDate startDate = LocalDate.ofInstant(from, SEOUL);
        byte[] listResponse = restClient.get()
                .uri(uriBuilder -> uriBuilder.path("/pblprfr")
                        .queryParam("service", apiKey)
                        .queryParam("stdate", startDate.format(REQUEST_DATE))
                        .queryParam("eddate", startDate.plusDays(30).format(REQUEST_DATE))
                        .queryParam("cpage", 1)
                        .queryParam("rows", 100)
                        .queryParam("shcate", genre.kopisCode())
                        .build())
                .retrieve()
                .body(byte[].class);

        List<ConcertResponse> concerts = loadConcerts(listResponse, genre, RESULT_LIMIT);
        concerts.sort(Comparator.comparing(ConcertResponse::startsAt));

        cachedConcerts.put(genre, List.copyOf(concerts));
        cacheExpiresAt.put(genre, Instant.now().plus(CACHE_TTL));
        return cachedConcerts.get(genre);
    }

    public synchronized List<ConcertResponse> search(String query, ConcertGenre genre) {
        String keyword = query.trim();
        if (apiKey.isBlank() || keyword.isBlank()) {
            return List.of();
        }

        String cacheKey = genre.name() + ":" + keyword.toLowerCase(Locale.ROOT);
        if (Instant.now().isBefore(searchCacheExpiresAt.getOrDefault(cacheKey, Instant.EPOCH))) {
            return cachedSearches.getOrDefault(cacheKey, List.of());
        }

        LocalDate endDate = LocalDate.now(SEOUL).plusDays(30);
        byte[] listResponse = restClient.get()
                .uri(uriBuilder -> uriBuilder.path("/pblprfr")
                        .queryParam("service", apiKey)
                        .queryParam("stdate", HISTORY_START.format(REQUEST_DATE))
                        .queryParam("eddate", endDate.format(REQUEST_DATE))
                        .queryParam("cpage", 1)
                        .queryParam("rows", 100)
                        .queryParam("shcate", genre.kopisCode())
                        .queryParam("shprfnm", keyword)
                        .build())
                .retrieve()
                .body(byte[].class);

        List<ConcertResponse> concerts = parseSearchConcerts(
                decode(listResponse),
                genre,
                Instant.now());
        concerts.sort(Comparator.comparing(ConcertResponse::startsAt).reversed());
        cachedSearches.put(cacheKey, List.copyOf(concerts));
        searchCacheExpiresAt.put(cacheKey, Instant.now().plus(CACHE_TTL));
        return cachedSearches.get(cacheKey);
    }

    List<ConcertResponse> parseSearchConcerts(
            String xml,
            ConcertGenre genre,
            Instant verifiedAt) {
        var dbs = parse(xml).getElementsByTagName("db");
        List<ConcertResponse> concerts = new ArrayList<>();
        for (int index = 0; index < dbs.getLength() && concerts.size() < SEARCH_RESULT_LIMIT; index++) {
            Element item = (Element) dbs.item(index);
            String kopisId = requiredText(item, "mt20id");
            String title = requiredText(item, "prfnm");
            String venueName = requiredText(item, "fcltynm");
            String area = requiredText(item, "area");
            double[] coordinates = regionCoordinates(area);
            concerts.add(new ConcertResponse(
                    stableId("concert", kopisId),
                    title,
                    List.of(),
                    new VenueSummary(
                            stableId("venue", venueName),
                            venueName,
                            area,
                            "KR",
                            null,
                            SEOUL.getId(),
                            coordinates[0],
                            coordinates[1]),
                    date(item, "prfpdfrom"),
                    date(item, "prfpdto"),
                    status(text(item, "prfstate")),
                    secureUrl(nullableText(item, "poster")),
                    "https://www.kopis.or.kr/por/db/pblprfr/pblprfrView.do?menuId=MNU_00020&mt20Id=" + kopisId,
                    "KOPIS",
                    genre,
                    FanCategoryClassifier.classify(title, List.of()),
                    verifiedAt,
                    List.of()));
        }
        return concerts;
    }

    private double[] regionCoordinates(String area) {
        if (area.contains("서울")) return new double[] { 37.5665, 126.9780 };
        if (area.contains("부산")) return new double[] { 35.1796, 129.0756 };
        if (area.contains("대구")) return new double[] { 35.8714, 128.6014 };
        if (area.contains("인천")) return new double[] { 37.4563, 126.7052 };
        if (area.contains("광주")) return new double[] { 35.1595, 126.8526 };
        if (area.contains("대전")) return new double[] { 36.3504, 127.3845 };
        if (area.contains("울산")) return new double[] { 35.5384, 129.3114 };
        if (area.contains("세종")) return new double[] { 36.4800, 127.2890 };
        if (area.contains("경기")) return new double[] { 37.4138, 127.5183 };
        if (area.contains("강원")) return new double[] { 37.8228, 128.1555 };
        if (area.contains("충북")) return new double[] { 36.6357, 127.4917 };
        if (area.contains("충남")) return new double[] { 36.5184, 126.8000 };
        if (area.contains("전북")) return new double[] { 35.7175, 127.1530 };
        if (area.contains("전남")) return new double[] { 34.8679, 126.9910 };
        if (area.contains("경북")) return new double[] { 36.4919, 128.8889 };
        if (area.contains("경남")) return new double[] { 35.4606, 128.2132 };
        if (area.contains("제주")) return new double[] { 33.4996, 126.5312 };
        return new double[] { 36.5, 127.8 };
    }

    public ConcertResponse findById(UUID id, Instant from, ConcertGenre genre) {
        ConcertResponse searchedConcert = cachedSearches.values().stream()
                .flatMap(List::stream)
                .filter(concert -> concert.id().equals(id))
                .findFirst()
                .orElse(null);
        if (searchedConcert != null) {
            return searchedConcert;
        }
        return findUpcoming(from, genre).stream()
                .filter(concert -> concert.id().equals(id))
                .findFirst()
                .orElse(null);
    }

    private List<ConcertResponse> loadConcerts(
            byte[] listResponse,
            ConcertGenre genre,
            int resultLimit) {
        List<ConcertResponse> concerts = new ArrayList<>();
        for (String kopisId : parseConcertIds(decode(listResponse))) {
            try {
                String detailXml = get("/pblprfr/" + kopisId);
                String facilityId = text(firstDb(detailXml), "mt10id");
                String facilityXml = get("/prfplc/" + facilityId);
                concerts.add(toConcert(detailXml, facilityXml, genre, Instant.now()));
            } catch (RuntimeException exception) {
                log.warn("Skipping invalid KOPIS concert {}", kopisId, exception);
            }
            if (concerts.size() == resultLimit) {
                break;
            }
        }
        return concerts;
    }

    List<String> parseConcertIds(String xml) {
        Document document = parse(xml);
        var dbs = document.getElementsByTagName("db");
        List<String> ids = new ArrayList<>();
        for (int index = 0; index < dbs.getLength(); index++) {
            String id = text((Element) dbs.item(index), "mt20id");
            if (!id.isBlank()) {
                ids.add(id);
            }
        }
        return ids;
    }

    ConcertResponse toConcert(
            String detailXml,
            String facilityXml,
            ConcertGenre genre,
            Instant verifiedAt) {
        Element detail = firstDb(detailXml);
        Element facility = firstDb(facilityXml);
        String kopisId = requiredText(detail, "mt20id");
        String facilityId = requiredText(detail, "mt10id");

        List<ArtistSummary> artists = Arrays.stream(text(detail, "prfcast").split(","))
                .map(String::trim)
                .filter(name -> !name.isBlank())
                .map(name -> new ArtistSummary(stableId("artist", name), name, null))
                .toList();

        return new ConcertResponse(
                stableId("concert", kopisId),
                requiredText(detail, "prfnm"),
                artists,
                new VenueSummary(
                        stableId("venue", facilityId),
                        requiredText(detail, "fcltynm"),
                        requiredText(detail, "area"),
                        "KR",
                        nullableText(facility, "adres"),
                        SEOUL.getId(),
                        number(facility, "la"),
                        number(facility, "lo")),
                date(detail, "prfpdfrom"),
                date(detail, "prfpdto"),
                status(text(detail, "prfstate")),
                secureUrl(nullableText(detail, "poster")),
                "https://www.kopis.or.kr/por/db/pblprfr/pblprfrView.do?menuId=MNU_00020&mt20Id=" + kopisId,
                "KOPIS",
                genre,
                FanCategoryClassifier.classify(requiredText(detail, "prfnm"), artists),
                verifiedAt,
                List.of());
    }

    private String get(String path) {
        byte[] response = restClient.get()
                .uri(uriBuilder -> uriBuilder.path(path).queryParam("service", apiKey).build())
                .retrieve()
                .body(byte[].class);
        return decode(response);
    }

    String decode(byte[] response) {
        if (response == null || response.length == 0) {
            throw new IllegalStateException("KOPIS returned an empty response");
        }
        return new String(response, StandardCharsets.UTF_8);
    }

    private Element firstDb(String xml) {
        var dbs = parse(xml).getElementsByTagName("db");
        if (dbs.getLength() == 0) {
            throw new IllegalArgumentException("KOPIS response has no performance data");
        }
        return (Element) dbs.item(0);
    }

    private Document parse(String xml) {
        if (xml == null || xml.isBlank()) {
            throw new IllegalArgumentException("KOPIS returned an empty response");
        }
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
            factory.setXIncludeAware(false);
            factory.setExpandEntityReferences(false);
            return factory.newDocumentBuilder().parse(new InputSource(new StringReader(xml)));
        } catch (Exception exception) {
            throw new IllegalArgumentException("Invalid KOPIS XML response", exception);
        }
    }

    private String requiredText(Element parent, String tagName) {
        String value = text(parent, tagName);
        if (value.isBlank()) {
            throw new IllegalArgumentException("KOPIS response is missing " + tagName);
        }
        return value;
    }

    private String nullableText(Element parent, String tagName) {
        String value = text(parent, tagName);
        return value.isBlank() ? null : value;
    }

    private String secureUrl(String value) {
        if (value == null) {
            return null;
        }
        return value.replaceFirst("^http://(www\\.)?kopis\\.or\\.kr", "https://kopis.or.kr");
    }

    private String text(Element parent, String tagName) {
        var nodes = parent.getElementsByTagName(tagName);
        return nodes.getLength() == 0 ? "" : nodes.item(0).getTextContent().trim();
    }

    private double number(Element parent, String tagName) {
        return Double.parseDouble(requiredText(parent, tagName));
    }

    private Instant date(Element parent, String tagName) {
        return LocalDate.parse(requiredText(parent, tagName), KOPIS_DATE)
                .atTime(LocalTime.NOON)
                .atZone(SEOUL)
                .toInstant();
    }

    private ConcertStatus status(String value) {
        return switch (value) {
            case "공연중" -> ConcertStatus.ON_SALE;
            case "공연완료" -> ConcertStatus.COMPLETED;
            case "공연취소" -> ConcertStatus.CANCELLED;
            default -> ConcertStatus.UPCOMING;
        };
    }

    private UUID stableId(String type, String value) {
        return UUID.nameUUIDFromBytes(("KOPIS:" + type + ":" + value).getBytes(StandardCharsets.UTF_8));
    }
}

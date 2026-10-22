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
import java.util.List;
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

    private final RestClient restClient;
    private final String apiKey;
    private final Map<ConcertGenre, List<ConcertResponse>> cachedConcerts = new EnumMap<>(ConcertGenre.class);
    private final Map<ConcertGenre, Instant> cacheExpiresAt = new EnumMap<>(ConcertGenre.class);

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
            if (concerts.size() == RESULT_LIMIT) {
                break;
            }
        }
        concerts.sort(Comparator.comparing(ConcertResponse::startsAt));

        cachedConcerts.put(genre, List.copyOf(concerts));
        cacheExpiresAt.put(genre, Instant.now().plus(CACHE_TTL));
        return cachedConcerts.get(genre);
    }

    public ConcertResponse findById(UUID id, Instant from, ConcertGenre genre) {
        return findUpcoming(from, genre).stream()
                .filter(concert -> concert.id().equals(id))
                .findFirst()
                .orElse(null);
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
                null,
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

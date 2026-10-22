package com.leedahye.stagepin.concert;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;

class KopisConcertClientTest {
    private final KopisConcertClient client = new KopisConcertClient("test-key");

    @Test
    void decodesKopisResponseAsUtf8() {
        byte[] response = "소란 겨울 콘서트".getBytes(StandardCharsets.UTF_8);

        assertThat(client.decode(response)).isEqualTo("소란 겨울 콘서트");
    }

    @Test
    void readsConcertIdsFromListResponse() {
        assertThat(client.parseConcertIds("""
                <dbs>
                  <db><mt20id>PF300001</mt20id></db>
                  <db><mt20id>PF300002</mt20id></db>
                </dbs>
                """))
                .containsExactly("PF300001", "PF300002");
    }

    @Test
    void mapsKopisDetailAndFacilityToConcert() {
        String detail = """
                <dbs><db>
                  <mt20id>PF300001</mt20id>
                  <mt10id>FC001247</mt10id>
                  <prfnm>STAGEPIN LIVE IN SEOUL</prfnm>
                  <fcltynm>올림픽공원 (KSPO DOME)</fcltynm>
                  <prfpdfrom>2026.11.12</prfpdfrom>
                  <prfpdto>2026.11.13</prfpdto>
                  <prfcast>DAY6, LUCY</prfcast>
                  <area>서울특별시</area>
                  <prfstate>공연예정</prfstate>
                </db></dbs>
                """;
        String facility = """
                <dbs><db>
                  <mt10id>FC001247</mt10id>
                  <adres>서울특별시 송파구 올림픽로 424</adres>
                  <la>37.52112</la>
                  <lo>127.1283636</lo>
                </db></dbs>
                """;

        ConcertResponse concert = client.toConcert(
                detail,
                facility,
                ConcertGenre.POPULAR_MUSIC,
                Instant.parse("2026-10-22T00:00:00Z"));

        assertThat(concert.source()).isEqualTo("KOPIS");
        assertThat(concert.genre()).isEqualTo(ConcertGenre.POPULAR_MUSIC);
        assertThat(concert.fanCategory()).isEqualTo(FanCategory.BAND);
        assertThat(concert.artists()).extracting(ConcertResponse.ArtistSummary::name)
                .containsExactly("DAY6", "LUCY");
        assertThat(concert.venue().countryCode()).isEqualTo("KR");
        assertThat(concert.venue().latitude()).isEqualTo(37.52112);
        assertThat(concert.startsAt()).isEqualTo("2026-11-12T03:00:00Z");
        assertThat(concert.schedules()).isEmpty();
        assertThat(concert.posterUrl()).isNull();
    }

    @Test
    void mapsPastConcertsFromSearchListWithoutDetailRequests() {
        List<ConcertResponse> concerts = client.parseSearchConcerts("""
                <dbs><db>
                  <mt20id>PF292781</mt20id>
                  <prfnm>DAY6 10th Anniversary Tour</prfnm>
                  <prfpdfrom>2026.07.03</prfpdfrom>
                  <prfpdto>2026.07.05</prfpdto>
                  <fcltynm>올림픽공원</fcltynm>
                  <poster>https://example.com/day6.jpg</poster>
                  <area>서울특별시</area>
                  <prfstate>공연완료</prfstate>
                </db></dbs>
                """, ConcertGenre.POPULAR_MUSIC, Instant.parse("2026-10-22T00:00:00Z"));

        assertThat(concerts).hasSize(1);
        assertThat(concerts.getFirst().title()).isEqualTo("DAY6 10th Anniversary Tour");
        assertThat(concerts.getFirst().status()).isEqualTo(ConcertStatus.COMPLETED);
        assertThat(concerts.getFirst().venue().name()).isEqualTo("올림픽공원");
        assertThat(concerts.getFirst().venue().latitude()).isEqualTo(37.5665);
        assertThat(concerts.getFirst().venue().longitude()).isEqualTo(126.9780);
        assertThat(concerts.getFirst().posterUrl()).isEqualTo("https://example.com/day6.jpg");
    }
}

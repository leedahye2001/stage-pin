package com.leedahye.stagepin.favorite;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class FavoritesStoreTest {
    final JsonMapper json = JsonMapper.builder().build();
    final FavoritesStore store = new FavoritesStore(mock(JdbcTemplate.class), json);
    static final String ARTIST = """
            {"id":"mbid:day6","name":"DAY6","searchName":"DAY6","description":"band","aliases":["데이식스"],
            "imageUrl":null,"imagePageUrl":null,"imageAttribution":null,"imageLicense":null}
            """;
    static final String CONCERT = """
            {"id":"00000000-0000-0000-0000-000000000123","title":"Fixture show","artists":[],
             "venue":{"id":"00000000-0000-0000-0000-000000000456","name":"Fixture venue","city":"Seoul",
              "countryCode":"KR","address":null,"timezone":"Asia/Seoul","latitude":0,"longitude":0},
             "startsAt":"2026-11-20T09:00:00Z","endsAt":null,"status":"UPCOMING","posterUrl":null,
             "officialUrl":"https://example.com/show","source":"KOPIS","genre":"POPULAR_MUSIC","fanCategory":"BAND",
             "verifiedAt":"2026-11-06T00:00:00Z","ticketLinks":[],"schedules":[]}
            """;
    @Test void validatesIdentityKindSnapshotAndDeletion() {
        assertThat(store.validate(new FavoritesStore.Change("ARTIST", "mbid:day6", true, json.readTree(ARTIST))))
                .contains("데이식스");
        assertThat(store.validate(new FavoritesStore.Change("ARTIST", "mbid:day6", false, null))).isNull();
        for (var change : java.util.List.of(
                new FavoritesStore.Change("GOODS", "x", true, json.readTree(ARTIST)),
                new FavoritesStore.Change("ARTIST", "other", true, json.readTree(ARTIST)),
                new FavoritesStore.Change("ARTIST", "x", null, null),
                new FavoritesStore.Change("ARTIST", "mbid:day6", true, json.readTree(ARTIST.replace("\"imageUrl\":null", "\"imageUrl\":\"javascript:alert(1)\""))),
                new FavoritesStore.Change("CONCERT", "x", true, json.readTree("{}")),
                new FavoritesStore.Change("ARTIST", "mbid:day6", true, json.readTree(ARTIST.replace("band", "x".repeat(20001))))))
            assertThatThrownBy(() -> store.validate(change)).isInstanceOf(ResponseStatusException.class);
    }
    @Test void serializesConcertDatesAndPreservesUnknownVenueCoordinates() {
        assertThat(store.validate(new FavoritesStore.Change("CONCERT", "00000000-0000-0000-0000-000000000123",
                true, json.readTree(CONCERT)))).contains("Fixture venue", "UPCOMING");
    }
}

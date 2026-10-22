package com.leedahye.stagepin.concert;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class MusicBrainzConcertClientTest {
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final MusicBrainzConcertClient client = new MusicBrainzConcertClient();

    @Test
    void mapsCc0EventMetadataToConcert() throws Exception {
        var event = objectMapper.readTree("""
                {
                  "id": "05ed573d-4a4f-46e2-98c0-1d3fcfcc680f",
                  "name": "Ray Wilson at Klosterkirche Lennep",
                  "life-span": { "begin": "2026-11-12" },
                  "relations": [{
                    "type": "main performer",
                    "artist": {
                      "id": "4e7ee52e-adbb-4410-a338-35d5615136c8",
                      "name": "Ray Wilson"
                    }
                  }]
                }
                """);
        var place = objectMapper.readTree("""
                {
                  "id": "b7e923c6-d158-4d1f-ba5d-4ac021a28779",
                  "name": "Kulturzentrum Klosterkirche",
                  "address": "Klostergasse 8, Remscheid, Germany",
                  "area": { "name": "Remscheid" },
                  "coordinates": { "latitude": 51.192729, "longitude": 7.25958 }
                }
                """);

        ConcertResponse concert = client.toConcert(event, place, Instant.parse("2026-10-22T00:00:00Z"));

        assertThat(concert.source()).isEqualTo("MUSICBRAINZ_CC0");
        assertThat(concert.artists()).extracting(ConcertResponse.ArtistSummary::name)
                .containsExactly("Ray Wilson");
        assertThat(concert.venue().city()).isEqualTo("Remscheid");
        assertThat(concert.venue().latitude()).isEqualTo(51.192729);
        assertThat(concert.startsAt()).isEqualTo("2026-11-12T12:00:00Z");
        assertThat(concert.officialUrl()).isEqualTo(
                "https://musicbrainz.org/event/05ed573d-4a4f-46e2-98c0-1d3fcfcc680f");
    }
}

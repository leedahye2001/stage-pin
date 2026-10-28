package com.leedahye.stagepin.artist;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.junit.jupiter.api.Test;

import tools.jackson.databind.ObjectMapper;

class ArtistCatalogClientTest {
    private final ArtistCatalogClient client = new ArtistCatalogClient(new ObjectMapper());

    @Test
    void blankSearchDoesNotCallExternalServices() {
        assertThat(client.search("  ")).isEmpty();
    }

    @Test
    void readsMultilingualAliasesFromMusicBrainz() {
        var artists = client.parseMusicBrainz(json("""
                {"artists":[{
                  "id":"77191d5f-1045-4b3b-ad7f-12ea398db929",
                  "name":"DAY6",
                  "country":"KR",
                  "aliases":[{"name":"데이식스"},{"name":"DAY6"}]
                }]}
                """));

        assertThat(artists).hasSize(1);
        assertThat(artists.getFirst().matches("데이식스")).isTrue();
        assertThat(artists.getFirst().matches("day6")).isTrue();
    }

    @Test
    void spotifyEnrichmentPreservesFavoritesAndMultilingualAliases() {
        var candidates = client.parseMusicBrainz(json("""
                {"artists":[{"id":"existing-id","name":"Young K","country":"KR",
                "aliases":[{"name":"영케이"},{"name":"youngk"}]}]}
                """));
        var spotify = new ArtistSearchResponse("spotify:id", "Young K", "Young K", "k-pop", List.of("Young K"),
                "https://i.scdn.co/image/example", "https://open.spotify.com/artist/1234567890123456789012", "Spotify", "Spotify");
        var result = client.matchSpotify(List.of(spotify), candidates, "영케이").getFirst();
        assertThat(result.id()).isEqualTo("existing-id");
        assertThat(result.aliases()).contains("영케이", "youngk");
        assertThat(result.searchName()).isEqualTo("Young K");
        assertThat(result.imageLicense()).isEqualTo("Spotify");
        assertThat(client.matchSpotify(List.of(spotify), List.of(), "Young K").getFirst().id()).isEqualTo("spotify:id");
    }

    @Test
    void ranksKoreanAliasMatchAheadOfSameNamedForeignArtist() {
        var artists = client.parseMusicBrainz(json("""
                {"artists":[
                  {"id":"foreign","name":"Young K","disambiguation":"US rapper","aliases":[]},
                  {"id":"day6","name":"강영현","country":"KR","disambiguation":"DAY6",
                   "aliases":[{"name":"영케이"},{"name":"Young K"}]}
                ]}
                """));

        assertThat(artists.get(1).rank("youngk")).isGreaterThan(artists.get(0).rank("youngk"));
    }

    @Test
    void mapsWikidataCommonsFilenameByMusicBrainzId() {
        var images = client.parseWikidataImages(json("""
                {"results":{"bindings":[{
                  "mbid":{"value":"artist-id"},
                  "image":{"value":"http://commons.wikimedia.org/wiki/Special:FilePath/DAY6%20in%20taiwan.jpg"}
                }]}}
                """));

        assertThat(images).containsEntry("artist-id", "DAY6 in taiwan.jpg");
    }

    @Test
    void readsImageAndAttributionFromCommons() {
        var images = client.parseCommonsImages(json("""
                {"query":{"pages":{"1":{
                  "title":"File:DAY6 in taiwan.jpg",
                  "imageinfo":[{
                    "thumburl":"https://upload.wikimedia.org/day6.jpg",
                    "descriptionurl":"https://commons.wikimedia.org/wiki/File:DAY6_in_taiwan.jpg",
                    "extmetadata":{
                      "Artist":{"value":"<b>Example Author</b>"},
                      "LicenseShortName":{"value":"CC BY-SA 4.0"},
                      "LicenseUrl":{"value":"https://creativecommons.org/licenses/by-sa/4.0"}
                    }
                  }]
                }}}}
                """));

        assertThat(images.get("DAY6 in taiwan.jpg").attribution()).isEqualTo("Example Author");
        assertThat(images.get("DAY6 in taiwan.jpg").license()).isEqualTo("CC BY-SA 4.0");
    }

    private byte[] json(String value) {
        return value.getBytes(StandardCharsets.UTF_8);
    }

    @Test
    void excludesUnknownNoncommercialAndIncompleteLicenses() {
        for (String license : new String[] {"", "All rights reserved", "CC BY-NC 4.0", "CC BY-SA 4.0"}) {
            var images = client.parseCommonsImages(json("""
                    {"query":{"pages":{"1":{"title":"File:Photo.jpg","imageinfo":[{
                      "thumburl":"https://upload.wikimedia.org/photo.jpg",
                      "descriptionurl":"https://commons.wikimedia.org/wiki/File:Photo.jpg",
                      "extmetadata":{"Artist":{"value":"Author"},"LicenseShortName":{"value":"%s"}}
                    }]}}}}
                    """.formatted(license)));
            assertThat(images).isEmpty();
        }
    }

    @Test
    void respectsCustomAttributionAndRejectsDeletionCandidates() {
        String body = """
                {"query":{"pages":{"1":{"title":"File:Photo.jpg","imageinfo":[{
                  "thumburl":"https://upload.wikimedia.org/photo.jpg",
                  "descriptionurl":"https://commons.wikimedia.org/wiki/File:Photo.jpg",
                  "extmetadata":{
                    "Artist":{"value":"Author"},"Attribution":{"value":"<b>Full credit &amp; source</b>"},
                    "LicenseShortName":{"value":"CC BY 4.0"},
                    "LicenseUrl":{"value":"https://creativecommons.org/licenses/by/4.0/"}%s
                  }
                }]}}}}
                """;
        assertThat(client.parseCommonsImages(json(body.formatted(""))).get("Photo.jpg").attribution()).isEqualTo("Full credit & source");
        assertThat(client.parseCommonsImages(json(body.formatted(",\"DeletionReason\":{\"value\":\"Under review\"}")))).isEmpty();
    }
}

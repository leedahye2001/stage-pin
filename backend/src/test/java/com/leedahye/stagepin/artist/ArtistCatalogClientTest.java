package com.leedahye.stagepin.artist;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;

import tools.jackson.databind.ObjectMapper;

class ArtistCatalogClientTest {
    private final ArtistCatalogClient client = new ArtistCatalogClient(new ObjectMapper());

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
                      "LicenseShortName":{"value":"CC BY-SA 4.0"}
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
}

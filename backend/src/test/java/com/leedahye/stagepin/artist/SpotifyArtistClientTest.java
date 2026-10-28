package com.leedahye.stagepin.artist;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.databind.ObjectMapper;

class SpotifyArtistClientTest {
    private MockRestServiceServer server;
    private SpotifyArtistClient client;
    private static final String SEARCH = "https://api.spotify.com/v1/search?q=DAY6&type=artist&limit=5";
    private static final String ARTISTS = """
            {"artists":{"items":[{"id":"1234567890123456789012","name":"DAY6","genres":["k-pop"],
              "images":[{"url":"https://i.scdn.co/image/day6"}]}]}}
            """;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        client = new SpotifyArtistClient(new ObjectMapper(), "client-id", "client-secret", builder);
    }

    private void token(String value) {
        server.expect(requestTo("https://accounts.spotify.com/api/token"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Basic Y2xpZW50LWlkOmNsaWVudC1zZWNyZXQ="))
                .andExpect(content().string("grant_type=client_credentials"))
                .andRespond(withSuccess("{\"access_token\":\"" + value + "\",\"expires_in\":3600}", MediaType.APPLICATION_JSON));
    }

    @Test
    void usesServerCredentialsAndReusesTokenBetweenSearches() {
        token("test-token");
        for (int i = 0; i < 2; i++) {
            server.expect(requestTo(SEARCH)).andExpect(header("Authorization", "Bearer test-token"))
                    .andRespond(withSuccess(ARTISTS, MediaType.APPLICATION_JSON));
        }
        var artist = client.search("DAY6").getFirst();
        assertThat(artist.id()).isEqualTo("spotify:1234567890123456789012");
        assertThat(artist.imagePageUrl()).isEqualTo("https://open.spotify.com/artist/1234567890123456789012");
        assertThat(artist.imageLicense()).isEqualTo("Spotify");
        assertThat(client.search("DAY6")).hasSize(1);
        server.verify();
    }

    @Test
    void refreshesAnUnauthorizedTokenOnce() {
        token("old");
        server.expect(requestTo(SEARCH)).andRespond(withStatus(HttpStatus.UNAUTHORIZED));
        token("new");
        server.expect(requestTo(SEARCH)).andExpect(header("Authorization", "Bearer new"))
                .andRespond(withSuccess(ARTISTS, MediaType.APPLICATION_JSON));
        assertThat(client.search("DAY6")).hasSize(1);
        server.verify();
    }

    @Test
    void respectsRetryAfterWithoutRepeatedExternalCalls() {
        token("test-token");
        server.expect(requestTo(SEARCH)).andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS).header("Retry-After", "60"));
        assertThatThrownBy(() -> client.search("DAY6")).isInstanceOf(RestClientException.class);
        assertThatThrownBy(() -> client.search("DAY6")).hasMessageContaining("cooldown");
        server.verify();
    }

    @Test
    void allowsMissingImagesButNeverUntrustedImageHosts() {
        token("test-token");
        server.expect(requestTo(SEARCH)).andRespond(withSuccess(ARTISTS.replace(
                "https://i.scdn.co/image/day6", "https://i.scdn.co.evil/image/day6"), MediaType.APPLICATION_JSON));
        assertThat(client.search("DAY6").getFirst().imageUrl()).isNull();
        server.verify();
    }

    @Test
    void missingCredentialsAndBlankQueriesMakeNoExternalRequests() {
        assertThat(client.search(" ")).isEmpty();
        var disabled = new SpotifyArtistClient(new ObjectMapper(), "", "", RestClient.builder());
        assertThat(disabled.configured()).isFalse();
        assertThat(disabled.search("DAY6")).isEmpty();
        server.verify();
    }

    @Test
    void malformedResponsesAreFailuresNotEmptySearchResults() {
        token("test-token");
        server.expect(requestTo(SEARCH)).andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));
        assertThatThrownBy(() -> client.search("DAY6")).isInstanceOf(RestClientException.class);
        server.verify();
    }
}

package com.leedahye.stagepin.concert;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import com.leedahye.stagepin.common.error.ApiErrorHandler;

class KopisDetailFailureTest {
    private final RestClient.Builder builder = RestClient.builder();
    private final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
    private final KopisConcertClient client = new KopisConcertClient("test-key", builder);
    private static final ConcertGenre GENRE = ConcertGenre.POPULAR_MUSIC;
    private static final String LIST = """
            <dbs><db><mt20id>PF289772</mt20id><prfnm>DAY6 부산</prfnm><fcltynm>벡스코</fcltynm>
            <area>부산광역시</area><prfpdfrom>2026.05.16</prfpdfrom><prfpdto>2026.05.17</prfpdto>
            <prfstate>공연완료</prfstate></db></dbs>
            """;
    private static final String DETAIL = """
            <dbs><db><mt20id>PF289772</mt20id><mt10id>FC001</mt10id><prfnm>DAY6 부산</prfnm>
            <fcltynm>벡스코</fcltynm><area>부산광역시</area><prfpdfrom>2026.05.16</prfpdfrom>
            <prfpdto>2026.05.17</prfpdto><prfstate>공연완료</prfstate>
            <relates><relate><relatenm>놀유니버스</relatenm>
            <relateurl>http://ticket.interpark.com/Ticket/Goods/GoodsInfo.asp?GoodsCode=26005357</relateurl>
            </relate></relates></db></dbs>
            """;
    private static final String FACILITY = """
            <dbs><db><mt10id>FC001</mt10id><adres>부산광역시</adres><la>35.1679</la><lo>129.1357</lo></db></dbs>
            """;

    @Test
    void failedDetailIs502NotSuccessfulSummaryAndNextAttemptCanRecoverTicketLinks() {
        expectSearch();
        server.expect(requestTo(containsString("/pblprfr/PF289772?"))).andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE));
        expectDetail(DETAIL);
        expectFacility();
        UUID id = searchId();

        assertThatThrownBy(() -> client.findById(id, Instant.now(), GENRE))
                .isInstanceOfSatisfying(ResponseStatusException.class, error -> {
                    assertThat(error.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
                    assertThat(error.getReason()).doesNotContain("test-key");
                });
        assertThat(client.findById(id, Instant.now(), GENRE).ticketLinks())
                .extracting(ConcertResponse.TicketLinkSummary::url)
                .containsExactly("http://ticket.interpark.com/Ticket/Goods/GoodsInfo.asp?GoodsCode=26005357");
        server.verify();
    }

    @Test
    void failedFacilityDoesNotTurnValidTicketLinksIntoAnEmptySuccessfulDetail() {
        expectSearch();
        expectDetail(DETAIL);
        server.expect(requestTo(containsString("/prfplc/FC001?"))).andRespond(withStatus(HttpStatus.BAD_GATEWAY));
        UUID id = searchId();
        assertThatThrownBy(() -> client.findById(id, Instant.now(), GENRE))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY));
        server.verify();
    }

    @Test
    void genuinelyMissingLinksRemainEmptyAfterSuccessfulFullDetailLookup() {
        expectSearch();
        expectDetail(DETAIL.replaceAll("(?s)<relates>.*?</relates>", ""));
        expectFacility();
        assertThat(client.findById(searchId(), Instant.now(), GENRE).ticketLinks()).isEmpty();
        server.verify();
    }

    @Test
    void apiReturns502InsteadOfA200WithEmptyTicketLinks() throws Exception {
        ConcertService service = mock(ConcertService.class);
        UUID id = UUID.randomUUID();
        when(service.findById(id, GENRE)).thenThrow(new ResponseStatusException(HttpStatus.BAD_GATEWAY, "상세 조회 실패"));
        var mvc = MockMvcBuilders.standaloneSetup(new ConcertController(service))
                .setControllerAdvice(new ApiErrorHandler()).build();
        mvc.perform(get("/api/v1/concerts/" + id).param("genre", GENRE.name()))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.message").value("상세 조회 실패"))
                .andExpect(jsonPath("$.ticketLinks").doesNotExist());
    }

    private void expectSearch() {
        server.expect(requestTo(containsString("/pblprfr?"))).andRespond(withSuccess(LIST, MediaType.APPLICATION_XML));
    }

    @Test
    void resolvesSavedSourceWithoutSearchCacheAndCachesFacilityCoordinates() {
        expectDetail(DETAIL);
        expectFacility();
        var concert = client.findByKopisId("PF289772", GENRE);
        assertThat(concert.venue().latitude()).isEqualTo(35.1679);
        assertThat(concert.venue().longitude()).isEqualTo(129.1357);
        assertThat(client.findByKopisId("PF289772", GENRE)).isEqualTo(concert);
        server.verify();
    }

    @Test
    void rejectsInvalidSourceBeforeMakingAnyUpstreamRequest() {
        assertThatThrownBy(() -> client.findByKopisId("../secret", GENRE))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        server.verify();
    }

    private void expectDetail(String xml) {
        server.expect(requestTo(containsString("/pblprfr/PF289772?"))).andRespond(withSuccess(xml, MediaType.APPLICATION_XML));
    }

    private void expectFacility() {
        server.expect(requestTo(containsString("/prfplc/FC001?"))).andRespond(withSuccess(FACILITY, MediaType.APPLICATION_XML));
    }

    private UUID searchId() {
        return client.search("DAY6", GENRE).getFirst().id();
    }
}

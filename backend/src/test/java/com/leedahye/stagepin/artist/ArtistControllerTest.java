package com.leedahye.stagepin.artist;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.ProblemDetail;
import org.springframework.web.client.ResourceAccessException;

class ArtistControllerTest {
    private final ArtistCatalogClient catalog = mock(ArtistCatalogClient.class);
    private final ArtistController controller = new ArtistController(catalog);

    @Test
    void distinguishesExternalFailureFromAnEmptySearch() {
        when(catalog.search("DAY6")).thenThrow(new ResourceAccessException("timeout"));
        var response = controller.search("DAY6");
        assertThat(response.getStatusCode().value()).isEqualTo(503);
        assertThat(((ProblemDetail) response.getBody()).getDetail()).contains("잠시 후");
        when(catalog.search("not found")).thenReturn(List.of());
        assertThat(controller.search("not found").getStatusCode().value()).isEqualTo(200);
    }
}

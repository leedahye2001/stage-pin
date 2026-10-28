package com.leedahye.stagepin.artist;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/v1/artists")
public class ArtistController {
    private final ArtistCatalogClient artistCatalogClient;

    public ArtistController(ArtistCatalogClient artistCatalogClient) {
        this.artistCatalogClient = artistCatalogClient;
    }

    @GetMapping
    ResponseEntity<?> search(@RequestParam String query) {
        try {
            return ResponseEntity.ok(artistCatalogClient.search(query));
        } catch (RestClientException exception) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(ProblemDetail.forStatusAndDetail(
                    HttpStatus.SERVICE_UNAVAILABLE, "외부 아티스트 정보 조회가 일시적으로 지연되고 있어요. 잠시 후 다시 시도해 주세요."));
        }
    }
}

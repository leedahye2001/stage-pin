package com.leedahye.stagepin.artist;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/artists")
public class ArtistController {
    private final ArtistCatalogClient artistCatalogClient;

    public ArtistController(ArtistCatalogClient artistCatalogClient) {
        this.artistCatalogClient = artistCatalogClient;
    }

    @GetMapping
    List<ArtistSearchResponse> search(@RequestParam String query) {
        return artistCatalogClient.search(query);
    }
}

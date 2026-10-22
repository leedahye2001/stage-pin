package com.leedahye.stagepin.artist;

import java.util.List;

public record ArtistSearchResponse(
        String id,
        String name,
        String searchName,
        String description,
        List<String> aliases,
        String imageUrl,
        String imagePageUrl,
        String imageAttribution,
        String imageLicense) {
}

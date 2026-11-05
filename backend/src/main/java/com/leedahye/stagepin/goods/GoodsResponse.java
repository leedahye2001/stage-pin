package com.leedahye.stagepin.goods;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record GoodsResponse(UUID id, UUID ownerId, String seller, String artist, String title,
        String kind, Long price, String wanted, String conditionCode, String description,
        boolean onsite, boolean delivery, String event, Instant createdAt, List<Photo> photos) {
    public record Photo(UUID id, String url, int width, int height) { }
}

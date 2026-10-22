package com.leedahye.stagepin.search;

import java.util.List;

public record NaverSearchResponse(boolean enabled, List<Item> items) {
    public record Item(String title, String link, String description) {
    }
}

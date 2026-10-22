package com.leedahye.stagepin.concert;

import java.util.List;
import java.util.Locale;

import com.leedahye.stagepin.concert.ConcertResponse.ArtistSummary;

final class FanCategoryClassifier {
    private static final List<String> IDOL_KEYWORDS = List.of(
            "FANCON", "FANMEETING", "팬콘", "팬미팅", "아이돌", "K-POP", "CLOSE YOUR EYES");
    private static final List<String> BAND_KEYWORDS = List.of(
            "밴드", "BAND", "DAY6", "LUCY", "N.FLYING", "엔플라잉", "QWER", "소란", "THE BOUND");

    private FanCategoryClassifier() {
    }

    static FanCategory classify(String title, List<ArtistSummary> artists) {
        String text = (title + " " + artists.stream().map(ArtistSummary::name).reduce("", (a, b) -> a + " " + b))
                .toUpperCase(Locale.ROOT);
        if (containsAny(text, IDOL_KEYWORDS)) {
            return FanCategory.IDOL;
        }
        if (containsAny(text, BAND_KEYWORDS)) {
            return FanCategory.BAND;
        }
        if (artists.size() == 1 || text.contains("단독")) {
            return FanCategory.SOLO;
        }
        // shortcut: KOPIS has no idol/solo/band field; expand with curated artist metadata when available.
        return FanCategory.OTHER;
    }

    private static boolean containsAny(String text, List<String> keywords) {
        return keywords.stream().anyMatch(text::contains);
    }
}

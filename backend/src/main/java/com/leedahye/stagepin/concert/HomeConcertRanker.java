package com.leedahye.stagepin.concert;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

final class HomeConcertRanker {
    private HomeConcertRanker() {}

    // Ranking evidence, not an assertion about an artist's identity or popularity.
    static int score(String title) {
        String text = title.toUpperCase(Locale.ROOT).replaceAll("[\\s·._-]", "");
        int score = 0;
        if (contains(text, "팬미팅", "팬콘", "FANMEETING", "FANCON", "FANCONCERT")) score = 100;
        if (contains(text, "단독콘서트", "SOLOCONCERT", "단독공연", "리사이틀")) score = Math.max(score, 90);
        if (contains(text, "월드투어", "아시아투어", "전국투어", "WORLDTOUR", "ASIATOUR", "LIVETOUR")) score = Math.max(score, 60);
        if (contains(text, "콘서트", "CONCERT", "내한", "쇼케이스", "SHOWCASE")) score = Math.max(score, 30);
        if (contains(text, "밴드", "BAND", "페스티벌", "FESTIVAL")) score = Math.max(score, 15);
        if (contains(text, "디제이", "DJ파티", "클럽파티", "나이트", "HALLOWEEN", "TRIBUTE", "헌정", "커버공연", "발표회", "정기연주회", "갈라", "기념행사", "창립")) score -= 100;
        return score;
    }

    private static boolean contains(String text, String... words) {
        return List.of(words).stream().anyMatch(text::contains);
    }

    static List<ConcertResponse> rank(List<ConcertResponse> concerts, java.time.Instant from) {
        return concerts.stream()
                .filter(c -> c.status() != ConcertStatus.CANCELLED && c.status() != ConcertStatus.COMPLETED)
                .filter(c -> !(c.endsAt() == null ? c.startsAt() : c.endsAt()).isBefore(from))
                .sorted(Comparator.comparingInt((ConcertResponse c) -> score(c.title())).reversed()
                        .thenComparing(ConcertResponse::startsAt).thenComparing(c -> c.id().toString()))
                .toList();
    }
}

package com.leedahye.stagepin.concert;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

class HomeConcertRankerTest {
    private final Instant now = Instant.parse("2026-10-29T00:00:00Z");

    @Test
    void prioritizesFanEventsAndArtistConcertsBeforeNearbyGenericEvents() {
        var party = show("Halloween Night", 1, ConcertStatus.UPCOMING);
        var generic = show("AREA X: GARAGE", 2, ConcertStatus.UPCOMING);
        var tour = show("Artist WORLD TOUR", 10, ConcertStatus.UPCOMING);
        var solo = show("가수 단독 콘서트", 9, ConcertStatus.UPCOMING);
        var fan = show("그룹 FAN MEETING", 20, ConcertStatus.UPCOMING);
        assertThat(HomeConcertRanker.rank(List.of(party, generic, tour, fan, solo), now))
                .containsExactly(fan, solo, tour, generic, party);
    }

    @Test
    void usesDateAsTieBreakerAndExcludesCancelledAndEndedShows() {
        var later = show("A 콘서트", 5, ConcertStatus.UPCOMING);
        var earlier = show("B 콘서트", 2, ConcertStatus.UPCOMING);
        assertThat(HomeConcertRanker.rank(List.of(later, show("팬미팅", -1, ConcertStatus.UPCOMING),
                show("팬콘", 1, ConcertStatus.CANCELLED), show("공연", 1, ConcertStatus.COMPLETED), earlier), now))
                .containsExactly(earlier, later);
    }

    @Test
    void doesNotTreatSoloCategoryOrUnrelatedNamesAsProofOfIdolPopularity() {
        assertThat(HomeConcertRanker.score("이름만 있는 공연")).isZero();
        assertThat(HomeConcertRanker.score("창립 기념 콘서트"))
                .isLessThan(HomeConcertRanker.score("가수 콘서트"));
        assertThat(HomeConcertRanker.score("팬·미팅"))
                .isEqualTo(HomeConcertRanker.score("FAN-MEETING"));
        assertThat(HomeConcertRanker.score("FAN CONCERT"))
                .isEqualTo(HomeConcertRanker.score("FANCON"));
    }

    private ConcertResponse show(String title, int days, ConcertStatus status) {
        return new ConcertResponse(UUID.nameUUIDFromBytes(title.getBytes(java.nio.charset.StandardCharsets.UTF_8)),
                title, List.of(), null, now.plusSeconds(days * 86400L), null, status,
                null, "", "KOPIS", ConcertGenre.POPULAR_MUSIC, FanCategory.SOLO, now, List.of(), List.of());
    }
}

package com.leedahye.stagepin.search;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.times;
import static org.mockito.ArgumentMatchers.anyString;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

class PopularSearchServiceTest {
    @Test
    void rankingRemainsStableWithinAnHourAndRefreshesAtTheNextBoundary() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        Clock clock = mock(Clock.class);
        when(clock.instant()).thenReturn(Instant.parse("2026-10-29T08:59:00Z"), Instant.parse("2026-10-29T08:59:59Z"), Instant.parse("2026-10-29T09:00:00Z"));
        when(jdbc.query(anyString(), org.mockito.ArgumentMatchers.<RowMapper<PopularSearchService.PopularTerm>>any()))
                .thenReturn(List.of(new PopularSearchService.PopularTerm("DAY6", 1)), List.of(new PopularSearchService.PopularTerm("BTS", 2)));
        PopularSearchService service = new PopularSearchService(jdbc, clock);
        var first = service.findPopular();
        service.record("BTS");
        assertThat(service.findPopular()).isSameAs(first);
        var next = service.findPopular();
        assertThat(next.items().getFirst().term()).isEqualTo("BTS");
        assertThat(next.updatedAt()).isEqualTo(Instant.parse("2026-10-29T09:00:00Z"));
        verify(jdbc, times(2)).query(anyString(), org.mockito.ArgumentMatchers.<RowMapper<PopularSearchService.PopularTerm>>any());
    }
    @Test
    void aliasesShareOneCounterAndOnlyConfirmedRecordCallsWrite() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        PopularSearchService service = new PopularSearchService(jdbc);
        assertThat(PopularSearchService.canonicalTerm("데이식스")).isEqualTo("DAY6");
        assertThat(PopularSearchService.canonicalTerm("Day 6")).isEqualTo("DAY6");
        assertThat(PopularSearchService.canonicalTerm("르세라핌")).isEqualTo("LE SSERAFIM");
        service.record("Day 6");
        verify(jdbc).update("UPDATE popular_search_term SET search_count = search_count + 1 WHERE term = ?", "DAY6");
    }

    @Test
    void arbitrarySearchesAndPersonalInformationAreNotRecorded() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        PopularSearchService service = new PopularSearchService(jdbc);
        for (String query : new String[] {"someone@example.com", "01012345678", "LIVE", "DAY6 공연", "x".repeat(101), ""}) service.record(query);
        service.record(null);
        verifyNoInteractions(jdbc);
    }
}

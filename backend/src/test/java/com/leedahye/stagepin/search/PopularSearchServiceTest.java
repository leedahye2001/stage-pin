package com.leedahye.stagepin.search;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

class PopularSearchServiceTest {
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

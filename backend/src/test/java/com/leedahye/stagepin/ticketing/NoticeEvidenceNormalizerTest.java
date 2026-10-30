package com.leedahye.stagepin.ticketing;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

class NoticeEvidenceNormalizerTest {
    @Test void restoresOnlyWhitespaceChangesFromAnActualSourceQuote() {
        var result = NoticeEvidenceNormalizer.anchor(new NoticeExtraction.Field("공연", "2026 년 12 월 5 일"), "공연: 2026년 12월 5일.");
        assertThat(result.evidence()).isEqualTo("2026년 12월 5일");
    }

    @Test void dropsInventedEvidenceInsteadOfCreatingAnUnsupportedQuote() {
        var result = NoticeEvidenceNormalizer.anchor(new NoticeExtraction.Field("NOL", "예매처: NOL"), "예매처: YES24");
        assertThat(result.value()).isEmpty();
    }

    @Test void fixesAmPmUsingSourceRatherThanTrustingTheModelTime() {
        String source = "선예매: 2026년 11월 2일 오후 8시 KST";
        var result = NoticeEvidenceNormalizer.date(new NoticeExtraction.Field("2026-11-02T08:00+09:00", source), source);
        assertThat(java.time.OffsetDateTime.parse(result.value()).getHour()).isEqualTo(20);
    }

    @Test void neverInfersMissingYearFromThePerformanceDate() {
        String source = "공연 2026년 12월 5일. 선예매: 11월 2일 오후 8시";
        var result = NoticeEvidenceNormalizer.date(new NoticeExtraction.Field("2026-11-02T20:00+09:00", "선예매: 11월 2일 오후 8시"), source);
        assertThat(result.value()).isEmpty();
    }

    @Test void rejectsDatesWithoutTimeAndImpossibleDates() {
        for (String source : new String[] {"2026년 11월 2일 시간 미정", "2026년 2월 30일 오후 8시"}) {
            assertThat(NoticeEvidenceNormalizer.date(new NoticeExtraction.Field("2026-11-02T20:00+09:00", source), source).value()).isEmpty();
        }
    }

    @Test void correctlyHandlesMidnightNoonAndMinutes() {
        for (var sample : java.util.Map.of("오전 12시", 0, "낮 12시", 12, "오후 7시 30분", 19, "20:00", 20).entrySet()) {
            String source = "2026년 11월 2일 " + sample.getKey();
            var result = NoticeEvidenceNormalizer.date(new NoticeExtraction.Field("2026-11-02T08:00+09:00", source), source);
            assertThat(java.time.OffsetDateTime.parse(result.value()).getHour()).isEqualTo(sample.getValue());
        }
    }
}

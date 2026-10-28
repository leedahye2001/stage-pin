package com.leedahye.stagepin.ticketing;

import static org.assertj.core.api.Assertions.assertThat;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/** Synthetic Korean notices are regression fixtures, not real official announcements. */
@EnabledIfEnvironmentVariable(named = "LIVE_AI_EVAL", matches = "true")
@SpringBootTest(classes = NoticeExtractionLiveEvaluationTest.EvaluationConfig.class, properties = {
    "spring.autoconfigure.exclude=org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration",
    "spring.main.lazy-initialization=true"
})
class NoticeExtractionLiveEvaluationTest {
    @org.springframework.context.annotation.Configuration
    @org.springframework.boot.autoconfigure.EnableAutoConfiguration
    @org.springframework.context.annotation.Import(AiNoticeExtractor.class)
    static class EvaluationConfig {}

    @Autowired NoticeExtractor extractor;

    record Case(String name, String text, String presale, String general, String vendor) {}

    static List<Case> cases() {
        var cases = new ArrayList<Case>();
        String[] vendors = {"NOL", "YES24", "멜론티켓", "티켓링크"};
        String[] codes = {"NOL", "YES24", "MELON", "TICKETLINK"};
        for (int i = 0; i < 4; i++) {
            String base = "가상 밴드 STAGEPIN의 가상 콘서트 TEST LIVE. 공연장: 테스트홀. 공연: 2026년 12월 5일. 예매처: "
                    + vendors[i] + ". 예매 링크 https://example.com/ticket\n";
            cases.add(new Case(codes[i] + "-both", base
                    + "팬클럽 인증: 2026년 10월 25일부터 10월 30일까지. 선예매: 2026년 11월 2일 오후 8시 KST. 일반예매: 2026년 11월 4일 오후 8시 KST.",
                    "2026-11-02T20:00:00+09:00", "2026-11-04T20:00:00+09:00", codes[i]));
            cases.add(new Case(codes[i] + "-general-only", base
                    + "선예매는 없습니다. 일반예매: 2026년 11월 4일 20:00 (한국시간).",
                    "", "2026-11-04T20:00:00+09:00", codes[i]));
            cases.add(new Case(codes[i] + "-missing-year", base.replace("2026년 12월 5일", "12월 5일")
                    + "선예매: 11월 2일 오후 8시. 일반예매: 11월 4일 오후 8시.", "", "", codes[i]));
            cases.add(new Case(codes[i] + "-missing-time", base
                    + "선예매: 2026년 11월 2일 시간 미정. 일반예매: 추후 공지.", "", "", codes[i]));
            cases.add(new Case(codes[i] + "-morning", base
                    + "선예매: 2026년 11월 2일 오전 10시 KST. 일반예매: 2026년 11월 4일 낮 12시 KST.",
                    "2026-11-02T10:00:00+09:00", "2026-11-04T12:00:00+09:00", codes[i]));
        }
        return cases;
    }

    @Test void measuresTwentySyntheticNoticesUsingRealModelCalls() throws Exception {
        var lines = new ArrayList<String>();
        lines.add("case,presale_exact,general_exact,vendor_exact,evidence_valid,latency_ms,total_tokens");
        int correctDates = 0;
        int correctVendors = 0;
        int validEvidence = 0;
        for (Case sample : cases()) {
            long started = System.nanoTime();
            var result = extractor.extract(sample.text());
            var data = result.extraction();
            boolean p = data.presaleAt().value().equals(sample.presale());
            boolean g = data.generalSaleAt().value().equals(sample.general());
            boolean v = data.vendor().value().equals(sample.vendor());
            boolean e = data.fields().stream().allMatch(field -> field.value().isBlank()
                    || (!field.evidence().isBlank() && sample.text().contains(field.evidence())));
            correctDates += (p ? 1 : 0) + (g ? 1 : 0);
            correctVendors += v ? 1 : 0;
            validEvidence += e ? 1 : 0;
            lines.add(String.join(",", sample.name(), "" + p, "" + g, "" + v, "" + e,
                    "" + (System.nanoTime() - started) / 1_000_000, "" + result.totalTokens()));
        }
        Path report = Path.of("build/reports/ai/notice-evaluation.csv");
        Files.createDirectories(report.getParent());
        Files.write(report, lines);
        System.out.printf("Synthetic evaluation: dates=%d/40 vendors=%d/20 evidence=%d/20%n",
                correctDates, correctVendors, validEvidence);
        assertThat(correctDates).isGreaterThanOrEqualTo(36);
        assertThat(correctVendors).isGreaterThanOrEqualTo(18);
        assertThat(validEvidence).isEqualTo(20);
    }
}

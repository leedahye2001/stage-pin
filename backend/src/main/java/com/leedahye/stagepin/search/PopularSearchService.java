package com.leedahye.stagepin.search;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class PopularSearchService {
    private static final Map<String, String> ALIASES = Map.ofEntries(
            Map.entry("day6", "DAY6"), Map.entry("데이식스", "DAY6"),
            Map.entry("bts", "BTS"), Map.entry("방탄소년단", "BTS"),
            Map.entry("seventeen", "SEVENTEEN"), Map.entry("세븐틴", "SEVENTEEN"),
            Map.entry("ive", "IVE"), Map.entry("아이브", "IVE"),
            Map.entry("aespa", "aespa"), Map.entry("에스파", "aespa"),
            Map.entry("nct", "NCT"), Map.entry("엔시티", "NCT"),
            Map.entry("straykids", "Stray Kids"), Map.entry("스트레이키즈", "Stray Kids"),
            Map.entry("txt", "TXT"), Map.entry("투모로우바이투게더", "TXT"),
            Map.entry("enhypen", "ENHYPEN"), Map.entry("엔하이픈", "ENHYPEN"),
            Map.entry("lesserafim", "LE SSERAFIM"), Map.entry("르세라핌", "LE SSERAFIM"));
    private final JdbcTemplate jdbc;

    public PopularSearchService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public PopularSearchResponse findPopular() {
        List<PopularTerm> terms = jdbc.query("""
                SELECT term, search_count FROM popular_search_term
                ORDER BY search_count DESC, seed_rank ASC LIMIT 10
                """, (row, index) -> new PopularTerm(row.getString("term"), row.getLong("search_count")));
        return new PopularSearchResponse(terms.stream().allMatch(term -> term.count() == 0), terms);
    }

    public void record(String query) {
        String term = canonicalTerm(query);
        // Only the public artist allowlist is counted; arbitrary user queries are never stored or published.
        if (term != null) jdbc.update("UPDATE popular_search_term SET search_count = search_count + 1 WHERE term = ?", term);
    }

    static String canonicalTerm(String query) {
        if (query == null || query.length() > 100) return null;
        return ALIASES.get(query.toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]", ""));
    }

    public record PopularTerm(String term, long count) { }
    public record PopularSearchResponse(boolean initial, List<PopularTerm> items) { }
}

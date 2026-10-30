package com.leedahye.stagepin.ticketing;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.regex.Pattern;

/** Re-anchors whitespace-only quote changes; never invents missing source facts. */
final class NoticeEvidenceNormalizer {
    private static final Pattern KOREAN_DATE = Pattern.compile(
            "(20\\d{2})년(\\d{1,2})월(\\d{1,2})일(오전|오후|낮)?(\\d{1,2})(?:시|:)(?:(\\d{1,2})분?)?");

    static NoticeExtraction normalize(NoticeExtraction data, String source) {
        return new NoticeExtraction(anchor(data.artistName(), source), anchor(data.concertTitle(), source),
                anchor(data.venue(), source), anchor(data.performancePeriod(), source),
                anchor(data.fanVerificationPeriod(), source), date(data.presaleAt(), source),
                date(data.generalSaleAt(), source), anchor(data.vendor(), source), anchor(data.ticketUrl(), source));
    }

    private static NoticeExtraction.Field empty() { return new NoticeExtraction.Field("", ""); }

    static NoticeExtraction.Field anchor(NoticeExtraction.Field field, String source) {
        if (field == null || field.value() == null || field.value().isBlank()
                || field.evidence() == null || field.evidence().isBlank()) return empty();
        if (source.contains(field.evidence())) return field;
        var compact = new StringBuilder();
        var positions = new ArrayList<Integer>();
        for (int i = 0; i < source.length(); i++) {
            if (!Character.isWhitespace(source.charAt(i))) {
                compact.append(source.charAt(i)); positions.add(i);
            }
        }
        String needle = field.evidence().replaceAll("\\s+", "");
        int start = compact.indexOf(needle);
        if (start < 0 || needle.isEmpty()) return empty();
        return new NoticeExtraction.Field(field.value(), source.substring(
                positions.get(start), positions.get(start + needle.length() - 1) + 1));
    }

    static NoticeExtraction.Field date(NoticeExtraction.Field original, String source) {
        var field = anchor(original, source);
        if (field.value().isEmpty()) return field;
        var match = KOREAN_DATE.matcher(field.evidence().replaceAll("\\s+", ""));
        try {
            if (match.find()) {
                int hour = Integer.parseInt(match.group(5));
                String period = match.group(4);
                if (period != null) {
                    if (hour < 1 || hour > 12 || (period.equals("낮") && hour != 12)) return empty();
                    hour = period.equals("오전") ? hour % 12 : hour % 12 + 12;
                }
                var time = LocalDateTime.of(Integer.parseInt(match.group(1)), Integer.parseInt(match.group(2)),
                        Integer.parseInt(match.group(3)), hour,
                        match.group(6) == null ? 0 : Integer.parseInt(match.group(6)));
                // Korean notice times default to KST; other explicit offsets require an exact ISO quote.
                String evidence = field.evidence();
                if (evidence.contains("UTC") || evidence.contains("GMT") || evidence.contains("PST") || evidence.contains("EST")) return empty();
                return new NoticeExtraction.Field(time.atOffset(ZoneOffset.ofHours(9)).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME), field.evidence());
            }
            OffsetDateTime.parse(field.value());
            return field.evidence().contains(field.value()) ? field : empty();
        } catch (RuntimeException exception) {
            return empty();
        }
    }
}

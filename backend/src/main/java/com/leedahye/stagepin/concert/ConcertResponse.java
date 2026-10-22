package com.leedahye.stagepin.concert;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.leedahye.stagepin.schedule.ScheduleType;

public record ConcertResponse(
        UUID id,
        String title,
        List<ArtistSummary> artists,
        VenueSummary venue,
        Instant startsAt,
        Instant endsAt,
        ConcertStatus status,
        String posterUrl,
        String officialUrl,
        String source,
        Instant verifiedAt,
        List<ScheduleSummary> schedules) {

    public record ArtistSummary(UUID id, String name, String imageUrl) {
    }

    public record VenueSummary(
            UUID id,
            String name,
            String city,
            String countryCode,
            String address,
            String timezone) {
    }

    public record ScheduleSummary(
            UUID id,
            ScheduleType type,
            Instant startsAt,
            Instant endsAt,
            String timezone,
            String sourceUrl,
            String description) {
    }
}


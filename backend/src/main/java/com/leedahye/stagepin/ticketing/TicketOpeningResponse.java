package com.leedahye.stagepin.ticketing;

import java.time.Instant;
import java.util.UUID;

import com.leedahye.stagepin.schedule.ScheduleType;

public record TicketOpeningResponse(
        UUID id,
        UUID concertId,
        String concertTitle,
        String artistName,
        String posterUrl,
        ScheduleType type,
        Instant opensAt,
        String timezone,
        TicketVendor vendor,
        String ticketUrl,
        String sourceUrl,
        Instant verifiedAt) {
}

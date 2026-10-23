package com.leedahye.stagepin.ticketing;

import java.time.Instant;
import java.util.UUID;

import com.leedahye.stagepin.schedule.ScheduleType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

record TicketOpeningRequest(
        UUID concertId,
        @NotBlank @Size(max = 240) String concertTitle,
        @NotBlank @Size(max = 120) String artistName,
        @Size(max = 1000) String posterUrl,
        @NotNull ScheduleType type,
        @NotNull Instant opensAt,
        @NotBlank @Size(max = 60) String timezone,
        @NotNull TicketVendor vendor,
        @NotBlank @Size(max = 1000) @Pattern(regexp = "https://.+") String ticketUrl,
        @NotBlank @Size(max = 1000) @Pattern(regexp = "https://.+") String sourceUrl) {
}

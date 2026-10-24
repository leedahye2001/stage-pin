package com.leedahye.stagepin.ticketing;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record NoticeExtraction(
        @NotNull @Valid Field artistName,
        @NotNull @Valid Field concertTitle,
        @NotNull @Valid Field venue,
        @NotNull @Valid Field performancePeriod,
        @NotNull @Valid Field fanVerificationPeriod,
        @NotNull @Valid Field presaleAt,
        @NotNull @Valid Field generalSaleAt,
        @NotNull @Valid Field vendor,
        @NotNull @Valid Field ticketUrl) {

    public record Field(@NotNull @Size(max = 1000) String value,
                        @NotNull @Size(max = 2000) String evidence) {}

    public java.util.List<Field> fields() {
        return java.util.List.of(artistName, concertTitle, venue, performancePeriod,
                fanVerificationPeriod, presaleAt, generalSaleAt, vendor, ticketUrl);
    }
}

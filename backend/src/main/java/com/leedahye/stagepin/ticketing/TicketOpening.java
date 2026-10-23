package com.leedahye.stagepin.ticketing;

import java.time.Instant;
import java.util.UUID;

import com.leedahye.stagepin.schedule.ScheduleType;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;

@Entity
public class TicketOpening {
    @Id
    private UUID id;
    private UUID concertId;
    private String concertTitle;
    private String artistName;
    private String posterUrl;
    @Enumerated(EnumType.STRING)
    private ScheduleType type;
    private Instant opensAt;
    private String timezone;
    @Enumerated(EnumType.STRING)
    private TicketVendor vendor;
    private String ticketUrl;
    private String sourceUrl;
    private Instant verifiedAt;

    protected TicketOpening() {
    }

    TicketOpening(
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
        this.id = UUID.randomUUID();
        this.concertId = concertId;
        this.concertTitle = concertTitle;
        this.artistName = artistName;
        this.posterUrl = posterUrl;
        this.type = type;
        this.opensAt = opensAt;
        this.timezone = timezone;
        this.vendor = vendor;
        this.ticketUrl = ticketUrl;
        this.sourceUrl = sourceUrl;
        this.verifiedAt = verifiedAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getConcertId() {
        return concertId;
    }

    public String getConcertTitle() {
        return concertTitle;
    }

    public String getArtistName() {
        return artistName;
    }

    public String getPosterUrl() {
        return posterUrl;
    }

    public ScheduleType getType() {
        return type;
    }

    public Instant getOpensAt() {
        return opensAt;
    }

    public String getTimezone() {
        return timezone;
    }

    public TicketVendor getVendor() {
        return vendor;
    }

    public String getTicketUrl() {
        return ticketUrl;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }
}

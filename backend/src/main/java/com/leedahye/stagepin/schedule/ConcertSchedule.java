package com.leedahye.stagepin.schedule;

import java.time.Instant;
import java.util.UUID;

import com.leedahye.stagepin.concert.Concert;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class ConcertSchedule {
    @Id
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "concert_id")
    private Concert concert;
    @Enumerated(EnumType.STRING)
    private ScheduleType type;
    private Instant startsAt;
    private Instant endsAt;
    private String timezone;
    private String sourceUrl;
    private String description;

    protected ConcertSchedule() {
    }

    public UUID getId() {
        return id;
    }

    public ScheduleType getType() {
        return type;
    }

    public Instant getStartsAt() {
        return startsAt;
    }

    public Instant getEndsAt() {
        return endsAt;
    }

    public String getTimezone() {
        return timezone;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public String getDescription() {
        return description;
    }
}


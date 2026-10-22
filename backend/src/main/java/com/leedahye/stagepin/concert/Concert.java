package com.leedahye.stagepin.concert;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

import com.leedahye.stagepin.artist.Artist;
import com.leedahye.stagepin.schedule.ConcertSchedule;
import com.leedahye.stagepin.venue.Venue;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;

@Entity
public class Concert {
    @Id
    private UUID id;
    private String title;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venue_id")
    private Venue venue;
    private Instant startsAt;
    private Instant endsAt;
    @Enumerated(EnumType.STRING)
    private ConcertStatus status;
    private String posterUrl;
    private String officialUrl;
    private String source;
    private Instant verifiedAt;

    @ManyToMany
    @JoinTable(
            name = "concert_artist",
            joinColumns = @JoinColumn(name = "concert_id"),
            inverseJoinColumns = @JoinColumn(name = "artist_id"))
    private Set<Artist> artists = new LinkedHashSet<>();

    @OneToMany(mappedBy = "concert")
    @OrderBy("startsAt ASC")
    private Set<ConcertSchedule> schedules = new LinkedHashSet<>();

    protected Concert() {
    }

    public UUID getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public Venue getVenue() {
        return venue;
    }

    public Instant getStartsAt() {
        return startsAt;
    }

    public Instant getEndsAt() {
        return endsAt;
    }

    public ConcertStatus getStatus() {
        return status;
    }

    public String getPosterUrl() {
        return posterUrl;
    }

    public String getOfficialUrl() {
        return officialUrl;
    }

    public String getSource() {
        return source;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public Set<Artist> getArtists() {
        return artists;
    }

    public Set<ConcertSchedule> getSchedules() {
        return schedules;
    }
}


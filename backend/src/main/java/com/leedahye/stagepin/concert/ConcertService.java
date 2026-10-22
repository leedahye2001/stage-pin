package com.leedahye.stagepin.concert;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.leedahye.stagepin.common.error.NotFoundException;
import com.leedahye.stagepin.concert.ConcertResponse.ArtistSummary;
import com.leedahye.stagepin.concert.ConcertResponse.ScheduleSummary;
import com.leedahye.stagepin.concert.ConcertResponse.VenueSummary;

@Service
@Transactional(readOnly = true)
public class ConcertService {
    private final ConcertRepository concertRepository;

    public ConcertService(ConcertRepository concertRepository) {
        this.concertRepository = concertRepository;
    }

    public List<ConcertResponse> findUpcoming(Instant from) {
        return concertRepository.findDistinctByStartsAtGreaterThanEqualOrderByStartsAtAsc(from).stream()
                .map(this::toResponse)
                .toList();
    }

    public ConcertResponse findById(UUID id) {
        return concertRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new NotFoundException("Concert not found: " + id));
    }

    private ConcertResponse toResponse(Concert concert) {
        var venue = concert.getVenue();
        return new ConcertResponse(
                concert.getId(),
                concert.getTitle(),
                concert.getArtists().stream()
                        .map(artist -> new ArtistSummary(artist.getId(), artist.getName(), artist.getImageUrl()))
                        .sorted(Comparator.comparing(ArtistSummary::name))
                        .toList(),
                new VenueSummary(
                        venue.getId(),
                        venue.getName(),
                        venue.getCity(),
                        venue.getCountryCode(),
                        venue.getAddress(),
                        venue.getTimezone(),
                        venue.getLatitude(),
                        venue.getLongitude()),
                concert.getStartsAt(),
                concert.getEndsAt(),
                concert.getStatus(),
                concert.getPosterUrl(),
                concert.getOfficialUrl(),
                concert.getSource(),
                concert.getVerifiedAt(),
                concert.getSchedules().stream()
                        .map(schedule -> new ScheduleSummary(
                                schedule.getId(),
                                schedule.getType(),
                                schedule.getStartsAt(),
                                schedule.getEndsAt(),
                                schedule.getTimezone(),
                                schedule.getSourceUrl(),
                                schedule.getDescription()))
                        .toList());
    }
}

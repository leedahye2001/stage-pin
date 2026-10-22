package com.leedahye.stagepin.concert;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.leedahye.stagepin.common.error.NotFoundException;
import com.leedahye.stagepin.concert.ConcertResponse.ArtistSummary;
import com.leedahye.stagepin.concert.ConcertResponse.ScheduleSummary;
import com.leedahye.stagepin.concert.ConcertResponse.VenueSummary;

@Service
@Transactional(readOnly = true)
public class ConcertService {
    private static final Logger log = LoggerFactory.getLogger(ConcertService.class);

    private final ConcertRepository concertRepository;
    private final KopisConcertClient kopisConcertClient;

    public ConcertService(
            ConcertRepository concertRepository,
            KopisConcertClient kopisConcertClient) {
        this.concertRepository = concertRepository;
        this.kopisConcertClient = kopisConcertClient;
    }

    public List<ConcertResponse> findUpcoming(Instant from, ConcertGenre genre) {
        try {
            List<ConcertResponse> liveConcerts = kopisConcertClient.findUpcoming(from, genre);
            if (!liveConcerts.isEmpty()) {
                return liveConcerts;
            }
        } catch (RuntimeException exception) {
            log.warn("KOPIS unavailable; returning Korean demo concerts", exception);
        }
        if (genre != ConcertGenre.POPULAR_MUSIC) {
            return List.of();
        }
        return concertRepository
                .findDistinctByStartsAtGreaterThanEqualAndVenueCountryCodeOrderByStartsAtAsc(from, "KR")
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ConcertResponse> search(String query, ConcertGenre genre) {
        try {
            return kopisConcertClient.search(query, genre);
        } catch (RuntimeException exception) {
            log.warn("KOPIS search unavailable for query: {}", query, exception);
            return List.of();
        }
    }

    public ConcertResponse findById(UUID id, ConcertGenre genre) {
        return concertRepository.findById(id)
                .map(this::toResponse)
                .orElseGet(() -> {
                    ConcertResponse liveConcert = kopisConcertClient.findById(id, Instant.now(), genre);
                    if (liveConcert == null) {
                        throw new NotFoundException("Concert not found: " + id);
                    }
                    return liveConcert;
                });
    }

    private ConcertResponse toResponse(Concert concert) {
        var venue = concert.getVenue();
        var artists = concert.getArtists().stream()
                .map(artist -> new ArtistSummary(artist.getId(), artist.getName(), artist.getImageUrl()))
                .sorted(Comparator.comparing(ArtistSummary::name))
                .toList();
        return new ConcertResponse(
                concert.getId(),
                concert.getTitle(),
                artists,
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
                ConcertGenre.POPULAR_MUSIC,
                FanCategoryClassifier.classify(concert.getTitle(), artists),
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

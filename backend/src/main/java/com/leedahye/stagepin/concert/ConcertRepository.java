package com.leedahye.stagepin.concert;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConcertRepository extends JpaRepository<Concert, UUID> {

    @EntityGraph(attributePaths = {"venue", "artists", "schedules"})
    List<Concert> findDistinctByStartsAtGreaterThanEqualAndVenueCountryCodeOrderByStartsAtAsc(
            Instant from,
            String countryCode);

    @Override
    @EntityGraph(attributePaths = {"venue", "artists", "schedules"})
    Optional<Concert> findById(UUID id);
}

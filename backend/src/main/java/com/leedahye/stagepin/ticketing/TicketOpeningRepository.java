package com.leedahye.stagepin.ticketing;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface TicketOpeningRepository extends JpaRepository<TicketOpening, UUID> {
    List<TicketOpening> findTop50ByOpensAtGreaterThanEqualOrderByOpensAtAsc(Instant from);
}

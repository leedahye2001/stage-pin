package com.leedahye.stagepin.ticketing;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

interface TicketNoticeRepository extends JpaRepository<TicketNotice, UUID> {
    List<TicketNotice> findTop30ByOrderByCreatedAtDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select n from TicketNotice n where n.id = :id")
    Optional<TicketNotice> findForApproval(UUID id);
}

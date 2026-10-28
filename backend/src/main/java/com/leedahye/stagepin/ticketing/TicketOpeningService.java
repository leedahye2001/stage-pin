package com.leedahye.stagepin.ticketing;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.ZoneId;
import java.time.DateTimeException;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class TicketOpeningService {
    private final TicketOpeningRepository repository;
    private final String adminKey;

    TicketOpeningService(
            TicketOpeningRepository repository,
            @Value("${stagepin.admin-key:}") String adminKey) {
        this.repository = repository;
        this.adminKey = adminKey;
    }

    public List<TicketOpeningResponse> findUpcoming(Instant from) {
        return repository.findTop50ByOpensAtGreaterThanEqualOrderByOpensAtAsc(from).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public TicketOpeningResponse create(String providedAdminKey, TicketOpeningRequest request) {
        verifyAdminKey(providedAdminKey);
        try {
            ZoneId.of(request.timezone());
        } catch (DateTimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid timezone", exception);
        }

        TicketOpening opening = new TicketOpening(
                request.concertId(),
                request.concertTitle().trim(),
                request.artistName().trim(),
                blankToNull(request.posterUrl()),
                request.type(),
                request.opensAt(),
                request.timezone(),
                request.vendor(),
                request.ticketUrl(),
                request.sourceUrl(),
                Instant.now());
        return toResponse(repository.save(opening));
    }

    void verifyAdminKey(String providedAdminKey) {
        if (adminKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Admin API is disabled");
        }
        byte[] expected = adminKey.getBytes(StandardCharsets.UTF_8);
        byte[] actual = providedAdminKey == null
                ? new byte[0]
                : providedAdminKey.getBytes(StandardCharsets.UTF_8);
        if (!MessageDigest.isEqual(expected, actual)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid admin key");
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private TicketOpeningResponse toResponse(TicketOpening opening) {
        return new TicketOpeningResponse(
                opening.getId(),
                opening.getConcertId(),
                opening.getConcertTitle(),
                opening.getArtistName(),
                opening.getPosterUrl(),
                opening.getType(),
                opening.getOpensAt(),
                opening.getTimezone(),
                opening.getVendor(),
                opening.getTicketUrl(),
                opening.getSourceUrl(),
                opening.getVerifiedAt());
    }
}

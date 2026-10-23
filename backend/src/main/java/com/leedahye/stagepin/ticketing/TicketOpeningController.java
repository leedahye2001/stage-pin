package com.leedahye.stagepin.ticketing;

import java.time.Instant;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1")
public class TicketOpeningController {
    private final TicketOpeningService service;

    TicketOpeningController(TicketOpeningService service) {
        this.service = service;
    }

    @GetMapping("/ticket-openings")
    List<TicketOpeningResponse> findUpcoming(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from) {
        return service.findUpcoming(from == null ? Instant.now() : from);
    }

    @PostMapping("/admin/ticket-openings")
    @ResponseStatus(HttpStatus.CREATED)
    TicketOpeningResponse create(
            @RequestHeader(name = "X-StagePin-Admin-Key", required = false) String adminKey,
            @Valid @RequestBody TicketOpeningRequest request) {
        return service.create(adminKey, request);
    }
}

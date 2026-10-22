package com.leedahye.stagepin.concert;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/concerts")
public class ConcertController {
    private final ConcertService concertService;

    public ConcertController(ConcertService concertService) {
        this.concertService = concertService;
    }

    @GetMapping
    List<ConcertResponse> findUpcoming(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(defaultValue = "POPULAR_MUSIC") ConcertGenre genre) {
        return concertService.findUpcoming(from == null ? Instant.now() : from, genre);
    }

    @GetMapping("/{id}")
    ConcertResponse findById(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "POPULAR_MUSIC") ConcertGenre genre) {
        return concertService.findById(id, genre);
    }
}

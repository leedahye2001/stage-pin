package com.leedahye.stagepin.ticketing;

import java.util.List;
import java.util.UUID;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/notices")
public class TicketNoticeController {
    private final TicketNoticeService service;

    TicketNoticeController(TicketNoticeService service) { this.service = service; }

    @GetMapping
    List<TicketNoticeService.NoticeResponse> list(
            @RequestHeader(name = "X-StagePin-Admin-Key", required = false) String key) {
        return service.list(key);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    TicketNoticeService.NoticeResponse analyze(
            @RequestHeader(name = "X-StagePin-Admin-Key", required = false) String key,
            @Valid @RequestBody TicketNoticeService.AnalyzeRequest request) {
        return service.analyze(key, request);
    }

    @PostMapping("/{id}/approve")
    TicketNoticeService.NoticeResponse approve(
            @RequestHeader(name = "X-StagePin-Admin-Key", required = false) String key,
            @PathVariable UUID id, @Valid @RequestBody NoticeExtraction reviewed) {
        return service.approve(key, id, reviewed);
    }
}

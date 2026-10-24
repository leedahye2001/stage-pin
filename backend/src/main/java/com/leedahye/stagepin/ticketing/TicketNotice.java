package com.leedahye.stagepin.ticketing;

import java.time.Instant;
import java.util.UUID;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
class TicketNotice {
    @Id
    UUID id;
    String sourceUrl;
    String sourceText;
    String extractedJson;
    String reviewedJson;
    String model;
    String promptVersion;
    long latencyMs;
    long totalTokens;
    String status;
    Instant createdAt;
    Instant approvedAt;

    protected TicketNotice() {}

    TicketNotice(String sourceUrl, String sourceText, String extractedJson,
            String model, String promptVersion, long latencyMs, long totalTokens) {
        this.id = UUID.randomUUID();
        this.sourceUrl = sourceUrl;
        this.sourceText = sourceText;
        this.extractedJson = extractedJson;
        this.model = model;
        this.promptVersion = promptVersion;
        this.latencyMs = latencyMs;
        this.totalTokens = totalTokens;
        this.status = "DRAFT";
        this.createdAt = Instant.now();
    }
}

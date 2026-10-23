package com.leedahye.stagepin.ticketing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.leedahye.stagepin.schedule.ScheduleType;

@ExtendWith(MockitoExtension.class)
class TicketOpeningServiceTest {
    @Mock
    private TicketOpeningRepository repository;

    @Test
    void createsAStagePinVerifiedOpeningWithTheAdminKey() {
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        TicketOpeningService service = new TicketOpeningService(repository, "secret-key");

        TicketOpeningResponse response = service.create("secret-key", new TicketOpeningRequest(
                null,
                "DAY6 Concert",
                "DAY6",
                null,
                ScheduleType.FAN_PRESALE,
                Instant.parse("2026-11-01T11:00:00Z"),
                "Asia/Seoul",
                TicketVendor.YES24,
                "https://ticket.yes24.com/example",
                "https://day6.jype.com/example"));

        assertThat(response.concertTitle()).isEqualTo("DAY6 Concert");
        assertThat(response.vendor()).isEqualTo(TicketVendor.YES24);
        assertThat(response.verifiedAt()).isNotNull();
    }

    @Test
    void rejectsAnInvalidAdminKey() {
        TicketOpeningService service = new TicketOpeningService(repository, "secret-key");

        assertThatThrownBy(() -> service.create("wrong-key", new TicketOpeningRequest(
                null,
                "DAY6 Concert",
                "DAY6",
                null,
                ScheduleType.GENERAL_SALE,
                Instant.parse("2026-11-02T11:00:00Z"),
                "Asia/Seoul",
                TicketVendor.OTHER,
                "https://example.com/ticket",
                "https://example.com/notice")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403 FORBIDDEN");
    }
}

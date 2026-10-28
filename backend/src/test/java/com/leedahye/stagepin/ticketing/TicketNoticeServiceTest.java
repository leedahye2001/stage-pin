package com.leedahye.stagepin.ticketing;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import java.util.Optional;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class TicketNoticeServiceTest {
    private final TicketNoticeRepository repository = mock(TicketNoticeRepository.class);
    private final TicketOpeningService openings = mock(TicketOpeningService.class);
    private final NoticeExtractor extractor = mock(NoticeExtractor.class);
    private final JsonMapper json = JsonMapper.builder().build();
    private final TicketNoticeService service = new TicketNoticeService(repository, openings, extractor, json,
            Validation.buildDefaultValidatorFactory().getValidator());
    private static final String SOURCE = "DAY6 공연 The Present. 선예매 2026년 11월 2일 오후 8시, 일반예매 2026년 11월 4일 오후 8시. NOL https://example.com/ticket";

    static NoticeExtraction.Field f(String value, String evidence) { return new NoticeExtraction.Field(value, evidence); }
    static NoticeExtraction.Field empty() { return f("", ""); }
    static NoticeExtraction valid() {
        return new NoticeExtraction(f("DAY6", "DAY6"), f("The Present", "The Present"), empty(), empty(), empty(),
                f("2026-11-02T20:00:00+09:00", "선예매 2026년 11월 2일 오후 8시"),
                f("2026-11-04T20:00:00+09:00", "일반예매 2026년 11월 4일 오후 8시"),
                f("NOL", "NOL"), f("https://example.com/ticket", "https://example.com/ticket"));
    }

    @Test void savesDraftAndOriginalWithoutPublishing() {
        when(extractor.extract(SOURCE)).thenReturn(new NoticeExtractor.Result(valid(), "test-model", 100));
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
        var draft = service.analyze("key", new TicketNoticeService.AnalyzeRequest("https://example.com/notice", SOURCE));
        assertThat(draft.status()).isEqualTo("DRAFT");
        assertThat(draft.sourceText()).isEqualTo(SOURCE);
        assertThat(draft.extracted()).isEqualTo(valid());
        verify(openings, never()).create(any(), any());
    }

    @Test void rejectsInventedEvidence() {
        assertThatThrownBy(() -> service.validateEvidence(valid(), "다른 공지 내용"))
                .hasMessageContaining("원문");
    }

    @Test void authenticatesBeforeCallingPaidModel() {
        doThrow(new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN))
                .when(openings).verifyAdminKey("wrong");
        assertThatThrownBy(() -> service.analyze("wrong", new TicketNoticeService.AnalyzeRequest("https://example.com", SOURCE)))
                .hasMessageContaining("403");
        verifyNoInteractions(extractor, repository);
    }

    @Test void publishesTwoSchedulesAndRepeatedApprovalIsIdempotent() {
        var notice = new TicketNotice("https://example.com/notice", SOURCE, json.writeValueAsString(valid()), "test", "v1", 10, 100);
        when(repository.findForApproval(notice.id)).thenReturn(Optional.of(notice));
        var result = service.approve("key", notice.id, valid());
        assertThat(result.status()).isEqualTo("APPROVED");
        assertThat(result.reviewed()).isEqualTo(valid());
        service.approve("key", notice.id, valid());
        verify(openings, times(2)).create(eq("key"), any());
    }

    @Test void rejectsAmbiguousDateBeforeAnyPublication() {
        var good = valid();
        var invalid = new NoticeExtraction(good.artistName(), good.concertTitle(), empty(), empty(), empty(),
                good.presaleAt(), f("11월 4일 오후 8시", "일반예매 2026년 11월 4일 오후 8시"), good.vendor(), good.ticketUrl());
        var notice = new TicketNotice("https://example.com/notice", SOURCE, json.writeValueAsString(good), "test", "v1", 0, 0);
        when(repository.findForApproval(notice.id)).thenReturn(Optional.of(notice));
        assertThatThrownBy(() -> service.approve("key", notice.id, invalid)).hasMessageContaining("ISO");
        verify(openings, never()).create(any(), any());
        assertThat(notice.status).isEqualTo("DRAFT");
    }
}

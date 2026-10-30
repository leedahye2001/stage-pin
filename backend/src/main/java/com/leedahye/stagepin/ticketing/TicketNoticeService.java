package com.leedahye.stagepin.ticketing;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import jakarta.validation.Valid;
import jakarta.validation.Validator;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;
import com.leedahye.stagepin.schedule.ScheduleType;

@Service
public class TicketNoticeService {
    private final TicketNoticeRepository repository;
    private final TicketOpeningService openings;
    private final NoticeExtractor extractor;
    private final JsonMapper json;
    private final Validator validator;

    TicketNoticeService(TicketNoticeRepository repository, TicketOpeningService openings,
            NoticeExtractor extractor, JsonMapper json, Validator validator) {
        this.repository = repository;
        this.openings = openings;
        this.extractor = extractor;
        this.json = json;
        this.validator = validator;
    }

    public record AnalyzeRequest(
            @NotBlank @Size(max = 1000) @Pattern(regexp = "https://[^\\s]+") String sourceUrl,
            @NotBlank @Size(min = 20, max = 16000) String text) {}

    public record NoticeResponse(UUID id, String sourceUrl, String sourceText,
            NoticeExtraction extracted, NoticeExtraction reviewed, String status,
            String model, String promptVersion, long latencyMs, long totalTokens,
            Instant createdAt, Instant approvedAt) {}

    // Model calls run outside database transactions; only the resulting draft is saved.
    public NoticeResponse analyze(String key, AnalyzeRequest request) {
        openings.verifyAdminKey(key);
        long started = System.nanoTime();
        NoticeExtractor.Result result = extractor.extract(request.text());
        validateEvidence(result.extraction(), request.text());
        var notice = new TicketNotice(request.sourceUrl(), request.text(),
                json.writeValueAsString(result.rawExtraction()), result.model(),
                AiNoticeExtractor.PROMPT_VERSION, (System.nanoTime() - started) / 1_000_000,
                result.totalTokens());
        return response(repository.save(notice));
    }

    public List<NoticeResponse> list(String key) {
        openings.verifyAdminKey(key);
        return repository.findTop30ByOrderByCreatedAtDesc().stream().map(this::response).toList();
    }

    @Transactional
    public NoticeResponse approve(String key, UUID id, @Valid NoticeExtraction reviewed) {
        openings.verifyAdminKey(key);
        TicketNotice notice = repository.findForApproval(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "공지를 찾을 수 없어요."));
        if (notice.status.equals("APPROVED")) return response(notice);
        validateEvidence(reviewed, notice.sourceText);
        if (reviewed.artistName().value().isBlank() || reviewed.artistName().value().length() > 120
                || reviewed.concertTitle().value().isBlank() || reviewed.concertTitle().value().length() > 240) {
            throw badRequest("아티스트(120자 이내)와 공연명(240자 이내)을 입력해 주세요.");
        }
        var requests = new ArrayList<TicketOpeningRequest>();
        addOpening(requests, reviewed.presaleAt(), ScheduleType.FAN_PRESALE, reviewed, notice.sourceUrl);
        addOpening(requests, reviewed.generalSaleAt(), ScheduleType.GENERAL_SALE, reviewed, notice.sourceUrl);
        if (requests.isEmpty()) throw badRequest("선예매 또는 일반예매 시작일을 확인해 주세요.");
        requests.forEach(request -> openings.create(key, request));
        notice.reviewedJson = json.writeValueAsString(reviewed);
        notice.status = "APPROVED";
        notice.approvedAt = Instant.now();
        repository.save(notice);
        return response(notice);
    }

    void validateEvidence(NoticeExtraction extraction, String source) {
        if (extraction == null || !validator.validate(extraction).isEmpty()) {
            throw badRequest("분석 결과 형식이 올바르지 않아요.");
        }
        for (var field : extraction.fields()) {
            if (!field.value().isBlank() && (field.evidence().isBlank() || !source.contains(field.evidence()))) {
                throw badRequest("입력한 값의 근거를 공지 원문에서 그대로 인용해 주세요.");
            }
        }
    }

    private void addOpening(List<TicketOpeningRequest> requests, NoticeExtraction.Field date,
            ScheduleType type, NoticeExtraction data, String sourceUrl) {
        if (date.value().isBlank()) return;
        Instant opensAt;
        TicketVendor vendor;
        try {
            opensAt = OffsetDateTime.parse(date.value()).toInstant();
            vendor = TicketVendor.valueOf(data.vendor().value());
        } catch (RuntimeException exception) {
            throw badRequest("날짜는 시간대가 포함된 ISO 형식, 예매처는 제공된 목록에서 선택해 주세요.");
        }
        var request = new TicketOpeningRequest(null, data.concertTitle().value(), data.artistName().value(),
                null, type, opensAt, "Asia/Seoul", vendor, data.ticketUrl().value(), sourceUrl);
        if (!validator.validate(request).isEmpty()) throw badRequest("예매 링크와 공연 정보를 확인해 주세요.");
        requests.add(request);
    }

    private NoticeResponse response(TicketNotice notice) {
        return new NoticeResponse(notice.id, notice.sourceUrl, notice.sourceText,
                NoticeEvidenceNormalizer.normalize(json.readValue(notice.extractedJson, NoticeExtraction.class), notice.sourceText),
                notice.reviewedJson == null ? null : json.readValue(notice.reviewedJson, NoticeExtraction.class),
                notice.status, notice.model, notice.promptVersion, notice.latencyMs, notice.totalTokens,
                notice.createdAt, notice.approvedAt);
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}

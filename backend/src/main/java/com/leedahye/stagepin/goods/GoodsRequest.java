package com.leedahye.stagepin.goods;

import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public record GoodsRequest(UUID requestId, String artist, String title, String kind, String price,
        String wanted, String conditionCode, String description, boolean onsite, boolean delivery, String event) {
    static final Set<String> CONDITIONS = Set.of("SEALED", "OPENED_UNUSED", "USED_GOOD", "USED_FAIR", "DAMAGED");

    GoodsRequest validated() {
        if (requestId == null) throw invalid("등록 요청 식별자가 필요해요.");
        String cleanArtist = text(artist, 60, true), cleanTitle = text(title, 80, true);
        if (!"SALE".equals(kind) && !"EXCHANGE".equals(kind)) throw invalid("판매 또는 교환을 선택해 주세요.");
        if (conditionCode == null || !CONDITIONS.contains(conditionCode)) throw invalid("굿즈 상태를 목록에서 선택해 주세요.");
        if (!onsite && !delivery) throw invalid("거래 방식을 하나 이상 골라 주세요.");
        String cleanEvent = onsite ? text(event, 200, true) : null;
        String cleanWanted = "EXCHANGE".equals(kind) ? text(wanted, 200, true) : "";
        if ("SALE".equals(kind) && (price == null || !price.matches("[0-9]{1,9}")
                || Long.parseLong(price) < 1 || Long.parseLong(price) > 100000000))
            throw invalid("판매 가격은 1원부터 1억 원까지 정수로 입력해 주세요.");
        return new GoodsRequest(requestId, cleanArtist, cleanTitle, kind, "SALE".equals(kind) ? price : null,
                cleanWanted, conditionCode, text(description, 1000, false), onsite, delivery, cleanEvent);
    }

    Long priceValue() { return price == null ? null : Long.valueOf(price); }

    private static String text(String value, int max, boolean required) {
        String clean = value == null ? "" : value.strip();
        if (clean.length() > max || required && clean.isBlank()) throw invalid("필수 입력과 글자 수 제한을 확인해 주세요.");
        return clean;
    }

    static ResponseStatusException invalid(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
}

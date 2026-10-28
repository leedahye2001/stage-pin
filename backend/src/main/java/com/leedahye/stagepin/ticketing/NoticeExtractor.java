package com.leedahye.stagepin.ticketing;

public interface NoticeExtractor {
    Result extract(String text);

    record Result(NoticeExtraction extraction, String model, long totalTokens) {}
}

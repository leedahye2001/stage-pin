package com.leedahye.stagepin.concert;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.leedahye.stagepin.concert.ConcertResponse.ArtistSummary;

class FanCategoryClassifierTest {
    @Test
    void classifiesFanFocusedPopularMusic() {
        assertThat(FanCategoryClassifier.classify("CLOSE YOUR EYES FANCON", List.of()))
                .isEqualTo(FanCategory.IDOL);
        assertThat(FanCategoryClassifier.classify("소란 겨울 콘서트", List.of(artist("고영배"))))
                .isEqualTo(FanCategory.BAND);
        assertThat(FanCategoryClassifier.classify("이윤지 단독 공연", List.of(artist("이윤지"))))
                .isEqualTo(FanCategory.SOLO);
        assertThat(FanCategoryClassifier.classify("뮤직 페스티벌", List.of()))
                .isEqualTo(FanCategory.OTHER);
    }

    private ArtistSummary artist(String name) {
        return new ArtistSummary(UUID.randomUUID(), name, null);
    }
}

package com.leedahye.stagepin.search;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class NaverSearchClientTest {
    @Test
    void reportsDisabledWhenCredentialsAreMissing() {
        NaverSearchResponse response = new NaverSearchClient("", "").search("DAY6");

        assertThat(response.enabled()).isFalse();
        assertThat(response.items()).isEmpty();
    }
}

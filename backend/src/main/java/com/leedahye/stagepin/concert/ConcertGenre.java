package com.leedahye.stagepin.concert;

public enum ConcertGenre {
    POPULAR_MUSIC("CCCD", "대중음악"),
    MUSICAL("GGGA", "뮤지컬"),
    PLAY("AAAA", "연극"),
    CLASSICAL("CCCA", "클래식");

    private final String kopisCode;
    private final String label;

    ConcertGenre(String kopisCode, String label) {
        this.kopisCode = kopisCode;
        this.label = label;
    }

    public String kopisCode() {
        return kopisCode;
    }

    public String label() {
        return label;
    }
}

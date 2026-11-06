package com.leedahye.stagepin.favorite;

import com.leedahye.stagepin.artist.ArtistSearchResponse;
import com.leedahye.stagepin.concert.ConcertResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Repository
public class FavoritesStore {
    private final JdbcTemplate jdbc;
    private final JsonMapper json;
    public FavoritesStore(JdbcTemplate jdbc, JsonMapper json) { this.jdbc = jdbc; this.json = json; }
    public record Change(String kind, String id, Boolean selected, JsonNode snapshot) {}
    public record State(List<JsonNode> artists, List<JsonNode> concerts) {}

    public State list(UUID member) {
        var artists = new ArrayList<JsonNode>();
        var concerts = new ArrayList<JsonNode>();
        jdbc.query("SELECT kind, snapshot::text FROM member_favorite WHERE member_id = ? ORDER BY created_at DESC, target_id",
                (org.springframework.jdbc.core.RowCallbackHandler) row -> {
                    var target = row.getString(1).equals("ARTIST") ? artists : concerts;
                    target.add(json.readTree(row.getString(2)));
                }, member);
        return new State(List.copyOf(artists), List.copyOf(concerts));
    }

    @Transactional
    public State change(UUID member, Change change) {
        String snapshot = validate(change);
        lock(member);
        if (!change.selected()) jdbc.update("DELETE FROM member_favorite WHERE member_id = ? AND kind = ? AND target_id = ?",
                member, change.kind(), change.id());
        else jdbc.update("""
                INSERT INTO member_favorite(member_id, kind, target_id, snapshot) VALUES (?, ?, ?, ?::jsonb)
                ON CONFLICT (member_id, kind, target_id) DO UPDATE SET snapshot = EXCLUDED.snapshot
                """, member, change.kind(), change.id(), snapshot);
        checkLimit(member);
        return list(member);
    }

    private void lock(UUID member) {
        jdbc.queryForObject("SELECT id FROM member_account WHERE id = ? FOR UPDATE", UUID.class, member);
    }
    private void checkLimit(UUID member) {
        if (jdbc.queryForObject("SELECT count(*) FROM member_favorite WHERE member_id = ?", Integer.class, member) > 200)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "찜은 아티스트·공연을 합쳐 최대 200개까지 저장할 수 있어요.");
    }
    String validate(Change change) {
        if (change == null || change.selected() == null || change.id() == null
                || !change.id().matches("[A-Za-z0-9:_-]{1,160}")
                || !("ARTIST".equals(change.kind()) || "CONCERT".equals(change.kind()))) throw invalid();
        if (!change.selected()) return null;
        if (change.snapshot() == null || !change.snapshot().isObject() || change.snapshot().toString().length() > 20000)
            throw invalid();
        try {
            if (change.kind().equals("ARTIST")) {
                var artist = json.readValue(change.snapshot().toString(), ArtistSearchResponse.class);
                if (!change.id().equals(artist.id()) || artist.name() == null || artist.name().isBlank()
                        || artist.searchName() == null || artist.aliases() == null) throw invalid();
                safeUrl(artist.imageUrl()); safeUrl(artist.imagePageUrl());
                return json.writeValueAsString(artist);
            }
            var concert = json.readValue(change.snapshot().toString(), ConcertResponse.class);
            if (!change.id().equals(String.valueOf(concert.id())) || concert.title() == null || concert.title().isBlank()
                    || concert.venue() == null || concert.artists() == null || concert.schedules() == null
                    || concert.ticketLinks() == null || concert.status() == null || concert.genre() == null
                    || concert.fanCategory() == null || concert.startsAt() == null || concert.verifiedAt() == null) throw invalid();
            safeUrl(concert.posterUrl()); safeUrl(concert.officialUrl());
            for (var artist : concert.artists()) { if (artist == null) throw invalid(); safeUrl(artist.imageUrl()); }
            for (var link : concert.ticketLinks()) { if (link == null) throw invalid(); safeUrl(link.url()); }
            for (var schedule : concert.schedules()) { if (schedule == null) throw invalid(); safeUrl(schedule.sourceUrl()); }
            return json.writeValueAsString(concert);
        } catch (RuntimeException exception) { throw invalid(); }
    }
    private static void safeUrl(String value) {
        if (value == null || value.isBlank()) return;
        var uri = java.net.URI.create(value);
        if (value.length() > 4096 || !("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))
                || uri.getHost() == null || uri.getUserInfo() != null) throw invalid();
    }
    private static ResponseStatusException invalid() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "찜할 아티스트·공연 정보를 확인해 주세요.");
    }
}

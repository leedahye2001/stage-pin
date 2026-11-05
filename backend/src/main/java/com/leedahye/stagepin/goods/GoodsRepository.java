package com.leedahye.stagepin.goods;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class GoodsRepository {
    private final JdbcTemplate jdbc;
    public GoodsRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Transactional
    public GoodsResponse create(UUID ownerId, GoodsRequest data, List<GoodsPhotoProcessor.Photo> photos) {
        UUID id = UUID.randomUUID();
        int inserted = jdbc.update("""
                INSERT INTO goods_listing (id, owner_id, request_id, artist, title, kind, price, wanted,
                    condition_code, description, onsite, delivery, event)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (owner_id, request_id) DO NOTHING
                """, id, ownerId, data.requestId(), data.artist(), data.title(), data.kind(), data.priceValue(),
                data.wanted(), data.conditionCode(), data.description(), data.onsite(), data.delivery(), data.event());
        if (inserted == 0) {
            id = jdbc.queryForObject("SELECT id FROM goods_listing WHERE owner_id = ? AND request_id = ?",
                    UUID.class, ownerId, data.requestId());
        } else {
            for (int i = 0; i < photos.size(); i++) {
                var photo = photos.get(i);
                jdbc.update("INSERT INTO goods_photo (id, listing_id, position, width, height, content) VALUES (?, ?, ?, ?, ?, ?)",
                        UUID.randomUUID(), id, i, photo.width(), photo.height(), photo.content());
            }
        }
        return find(id);
    }

    public List<GoodsResponse> list(UUID ownerId, int limit, int offset) {
        return query("SELECT * FROM goods_listing " + (ownerId == null ? "" : "WHERE owner_id = ? ")
                + "ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?",
                ownerId == null ? new Object[]{limit, offset} : new Object[]{ownerId, limit, offset});
    }

    public GoodsResponse find(UUID id) {
        return query("SELECT * FROM goods_listing WHERE id = ?", id).stream().findFirst().orElse(null);
    }

    public byte[] photo(UUID id) {
        return jdbc.query("SELECT content FROM goods_photo WHERE id = ?", (row, index) -> row.getBytes(1), id)
                .stream().findFirst().orElse(null);
    }

    private List<GoodsResponse> query(String selection, Object... args) {
        // Fetch metadata in one join; list/detail JSON never loads the image BYTEA columns.
        return jdbc.query("SELECT g.*, m.nickname, p.id AS photo_id, p.width, p.height FROM (" + selection + ") g "
                + "JOIN member_account m ON m.id = g.owner_id LEFT JOIN goods_photo p ON p.listing_id = g.id "
                + "ORDER BY g.created_at DESC, g.id DESC, p.position", (ResultSetExtractor<List<GoodsResponse>>) rows -> {
            var result = new LinkedHashMap<UUID, GoodsResponse>();
            while (rows.next()) {
                UUID id = rows.getObject("id", UUID.class);
                if (!result.containsKey(id)) result.put(id, new GoodsResponse(id, rows.getObject("owner_id", UUID.class),
                        rows.getString("nickname"), rows.getString("artist"), rows.getString("title"), rows.getString("kind"),
                        rows.getObject("price", Long.class), rows.getString("wanted"), rows.getString("condition_code"),
                        rows.getString("description"), rows.getBoolean("onsite"), rows.getBoolean("delivery"),
                        rows.getString("event"), rows.getTimestamp("created_at").toInstant(), new ArrayList<>()));
                UUID photoId = rows.getObject("photo_id", UUID.class);
                if (photoId != null) result.get(id).photos().add(new GoodsResponse.Photo(photoId,
                        "/api/v1/goods/photos/" + photoId, rows.getInt("width"), rows.getInt("height")));
            }
            return List.copyOf(result.values());
        }, args);
    }
}

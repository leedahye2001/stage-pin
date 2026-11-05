package com.leedahye.stagepin.goods;

import com.leedahye.stagepin.auth.MemberSessionAccess;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.json.JsonMapper;

@RestController
@RequestMapping("/api/v1/goods")
public class GoodsController {
    private final GoodsService goods;
    private final MemberSessionAccess sessions;
    private final JsonMapper json;

    public GoodsController(GoodsService goods, MemberSessionAccess sessions, JsonMapper json) {
        this.goods = goods;
        this.sessions = sessions;
        this.json = json;
    }

    @GetMapping
    ResponseEntity<List<GoodsResponse>> list(@RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(goods.list(null, page));
    }

    @GetMapping("/mine")
    ResponseEntity<List<GoodsResponse>> mine(HttpServletRequest request, @RequestParam(defaultValue = "0") int page) {
        var member = sessions.requireMember(request);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(goods.list(member.id(), page));
    }

    @GetMapping("/{id}")
    ResponseEntity<GoodsResponse> detail(@PathVariable UUID id) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(goods.find(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ResponseEntity<GoodsResponse> create(HttpServletRequest request, @RequestParam String metadata,
            @RequestPart(value = "photos", required = false) List<MultipartFile> photos) {
        var member = sessions.requireWriter(request);
        if (metadata.length() > 10000) throw GoodsRequest.invalid("입력 내용이 너무 길어요.");
        GoodsRequest data;
        try { data = json.readValue(metadata, GoodsRequest.class); }
        catch (RuntimeException exception) { throw GoodsRequest.invalid("등록할 입력 내용을 확인해 주세요."); }
        if (data == null) throw GoodsRequest.invalid("등록할 입력 내용이 필요해요.");
        var result = goods.create(member.id(), data, photos);
        return ResponseEntity.created(URI.create("/api/v1/goods/" + result.id()))
                .cacheControl(CacheControl.noStore()).body(result);
    }

    @GetMapping(value = "/photos/{id}", produces = MediaType.IMAGE_JPEG_VALUE)
    ResponseEntity<byte[]> photo(@PathVariable UUID id) {
        return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG)
                .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePublic())
                .header("X-Content-Type-Options", "nosniff")
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=goods.jpg").body(goods.photo(id));
    }
}

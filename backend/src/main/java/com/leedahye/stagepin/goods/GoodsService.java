package com.leedahye.stagepin.goods;

import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.leedahye.stagepin.common.error.NotFoundException;

@Service
public class GoodsService {
    private final GoodsRepository repository;
    private final GoodsPhotoProcessor processor;
    public GoodsService(GoodsRepository repository, GoodsPhotoProcessor processor) {
        this.repository = repository;
        this.processor = processor;
    }

    public GoodsResponse create(UUID ownerId, GoodsRequest request, List<MultipartFile> files) {
        var data = request.validated();
        if (files == null || files.isEmpty() || files.size() > 5)
            throw GoodsRequest.invalid("굿즈 사진은 1장부터 5장까지 첨부해 주세요.");
        // Decode/validate every image before opening the repository's write transaction.
        var photos = files.stream().map(processor::process).toList();
        return repository.create(ownerId, data, photos);
    }

    public List<GoodsResponse> list(UUID ownerId, int page) {
        if (page < 0 || page > 10000) throw GoodsRequest.invalid("페이지 범위를 확인해 주세요.");
        return repository.list(ownerId, 24, page * 24);
    }

    public GoodsResponse find(UUID id) {
        var item = repository.find(id);
        if (item == null) throw new NotFoundException("굿즈를 찾을 수 없어요.");
        return item;
    }

    public byte[] photo(UUID id) {
        var content = repository.photo(id);
        if (content == null) throw new NotFoundException("사진을 찾을 수 없어요.");
        return content;
    }
}

package com.leedahye.stagepin.goods;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class GoodsServiceTest {
    static GoodsRequest sale() {
        return new GoodsRequest(UUID.randomUUID(), " DAY6 ", " 포토카드 ", "SALE", "12000", "",
                "OPENED_UNUSED", "설명", false, true, null);
    }

    static MockMultipartFile photo() throws Exception {
        var output = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(32, 24, BufferedImage.TYPE_INT_RGB), "png", output);
        return new MockMultipartFile("photos", "test.png", "image/png", output.toByteArray());
    }

    @Test
    void normalizesRealPixelsNotClaimedFilenameOrMimeType() throws Exception {
        var processor = new GoodsPhotoProcessor();
        var uploaded = photo();
        var result = processor.process(new MockMultipartFile("photos", "wrong.svg", "text/plain", uploaded.getBytes()));
        assertThat(result.content()).startsWith((byte) 0xff, (byte) 0xd8);
        assertThat(ImageIO.read(new ByteArrayInputStream(result.content())).getWidth()).isEqualTo(32);
        assertThatThrownBy(() -> processor.process(new MockMultipartFile("photos", "fake.jpg", "image/jpeg", "<script>bad</script>".getBytes())))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void scalesPhotosAndRejectsEmptyOversizedAndUnsupportedImages() throws Exception {
        var processor = new GoodsPhotoProcessor();
        var output = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(2000, 100, BufferedImage.TYPE_INT_RGB), "png", output);
        var result = processor.process(new MockMultipartFile("photos", output.toByteArray()));
        assertThat(result.width()).isEqualTo(1600);
        assertThat(result.height()).isEqualTo(80);
        for (var file : List.of(new MockMultipartFile("photos", new byte[0]),
                new MockMultipartFile("photos", new byte[10 * 1024 * 1024 + 1]),
                new MockMultipartFile("photos", "fake.svg", "image/svg+xml", "<svg/>".getBytes()))) {
            assertThatThrownBy(() -> processor.process(file)).isInstanceOf(ResponseStatusException.class);
        }
    }

    @Test
    void validatesAllFilesBeforeSavingAndRequiresOneToFivePhotos() throws Exception {
        var repository = mock(GoodsRepository.class);
        var service = new GoodsService(repository, new GoodsPhotoProcessor());
        UUID owner = UUID.randomUUID();
        assertThatThrownBy(() -> service.create(owner, sale(), List.of())).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.create(owner, sale(), java.util.Collections.nCopies(6, photo())))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.create(owner, sale(), List.of(photo(), new MockMultipartFile("photos", "bad".getBytes()))))
                .isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(repository);
        service.create(owner, sale(), List.of(photo()));
        verify(repository).create(eq(owner), argThat(data -> data.artist().equals("DAY6") && data.priceValue() == 12000), anyList());
    }

    @Test
    void rejectsInvalidPricesConditionsKindsAndTradeMethods() {
        for (String price : List.of("0", "-1", "1.5", "1e3", "100000001", "1000000000", "원12000", "")) {
            var value = new GoodsRequest(UUID.randomUUID(), "가수", "제목", "SALE", price, "", "SEALED", "", false, true, null);
            assertThatThrownBy(value::validated).isInstanceOf(ResponseStatusException.class);
        }
        for (var value : List.of(
                new GoodsRequest(null, "가수", "제목", "SALE", "1", "", "SEALED", "", false, true, null),
                new GoodsRequest(UUID.randomUUID(), "가수", "제목", "SALE", "1", "", "UNKNOWN", "", false, true, null),
                new GoodsRequest(UUID.randomUUID(), "가수", "제목", "TRADE", "1", "", "SEALED", "", false, true, null),
                new GoodsRequest(UUID.randomUUID(), "가수", "제목", "SALE", "1", "", "SEALED", "", false, false, null),
                new GoodsRequest(UUID.randomUUID(), "가수", "제목", "SALE", "1", "", "SEALED", "", true, false, ""),
                new GoodsRequest(UUID.randomUUID(), "가수", "제목", "EXCHANGE", null, "", "SEALED", "", false, true, null))) {
            assertThatThrownBy(value::validated).isInstanceOf(ResponseStatusException.class);
        }
        var exchange = new GoodsRequest(UUID.randomUUID(), "가수", "제목", "EXCHANGE", "999", "원필 포카", "SEALED", "", true, false, "DAY6 공연").validated();
        assertThat(exchange.priceValue()).isNull();
        assertThat(exchange.wanted()).isEqualTo("원필 포카");
        assertThatThrownBy(() -> new GoodsService(mock(GoodsRepository.class), new GoodsPhotoProcessor()).list(null, -1))
                .isInstanceOf(ResponseStatusException.class);
    }
}

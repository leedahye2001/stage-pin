package com.leedahye.stagepin.goods;

import java.awt.Color;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import javax.imageio.ImageIO;
import javax.imageio.stream.MemoryCacheImageInputStream;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class GoodsPhotoProcessor {
    record Photo(byte[] content, int width, int height) { }

    Photo process(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() > 10 * 1024 * 1024)
            throw GoodsRequest.invalid("사진은 장당 10MB 이하로 첨부해 주세요.");
        try (var input = new MemoryCacheImageInputStream(file.getInputStream())) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw GoodsRequest.invalid("JPEG 또는 PNG 사진을 첨부해 주세요.");
            var reader = readers.next();
            try {
                String format = reader.getFormatName();
                if (!format.equalsIgnoreCase("JPEG") && !format.equalsIgnoreCase("PNG"))
                    throw GoodsRequest.invalid("JPEG 또는 PNG 사진을 첨부해 주세요.");
                reader.setInput(input, true, true);
                int width = reader.getWidth(0), height = reader.getHeight(0);
                if (width < 1 || height < 1 || (long) width * height > 50000000L)
                    throw GoodsRequest.invalid("사진 해상도가 너무 커요. 작은 사진으로 다시 선택해 주세요.");
                var parameters = reader.getDefaultReadParam();
                int sample = Math.max(1, Math.max(width, height) / 1600);
                parameters.setSourceSubsampling(sample, sample, 0, 0);
                BufferedImage source = reader.read(0, parameters);
                double scale = Math.min(1.0, 1600.0 / Math.max(source.getWidth(), source.getHeight()));
                int outputWidth = Math.max(1, (int) (source.getWidth() * scale));
                int outputHeight = Math.max(1, (int) (source.getHeight() * scale));
                var image = new BufferedImage(outputWidth, outputHeight, BufferedImage.TYPE_INT_RGB);
                var graphics = image.createGraphics();
                try {
                    graphics.setColor(Color.WHITE);
                    graphics.fillRect(0, 0, outputWidth, outputHeight);
                    graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                    graphics.drawImage(source, 0, 0, outputWidth, outputHeight, null);
                } finally { graphics.dispose(); source.flush(); }
                // Re-encode pixels only: never publish original EXIF/GPS or arbitrary uploaded bytes.
                var output = new ByteArrayOutputStream();
                try { ImageIO.write(image, "jpeg", output); } finally { image.flush(); }
                byte[] content = output.toByteArray();
                if (content.length == 0 || content.length > 2 * 1024 * 1024)
                    throw GoodsRequest.invalid("저장할 사진이 너무 커요. 작은 사진으로 다시 선택해 주세요.");
                return new Photo(content, outputWidth, outputHeight);
            } finally { reader.dispose(); }
        } catch (IOException | IllegalArgumentException exception) {
            throw GoodsRequest.invalid("사진 파일을 읽지 못했어요. JPEG 또는 PNG 사진을 다시 선택해 주세요.");
        }
    }
}

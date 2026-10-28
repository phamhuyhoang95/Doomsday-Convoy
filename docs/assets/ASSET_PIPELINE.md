# Pipeline tài nguyên A1/A2

## Nguồn và số lượng

- A1: 4 ảnh được người dùng dùng làm hướng mỹ thuật; map, gara, Minh, xe khách.
- A2: 25 ảnh mới + 4 A1 = 29 master được chọn. Có 3 bản draft đầu được giữ để truy nguồn; catalog chọn `-v2` cho Overpass/Service/Hospital Records.
- 38 ID hình = map 1 + location 8 + event 12 + portrait 8 + skill 4 + artifact 2 + anomaly 1 + vehicle 2. Event cùng bối cảnh dùng lại ảnh có chủ đích.

## File nguồn chính xác

| File/thư mục | Vai trò |
|---|---|
| `art/asset-pack-a1/manifest.json` | Metadata 4 master A1 |
| `art/production-a2/jobs.json` |25 jobs/base prompts, ID/kind/master path |
| `art/production-a2/prompts-final.json` | Prompt chính xác đã gửi cho25 generation calls |
| `art/production-a2/receipts/` | Nguồn output từng ảnh, repair prompts và revision2 |
| `art/production-a2/masters/` | PNG mới; A1 giữ ở gói A1, không ghi đè |
| `art/production-a2/build-manifest.json` |29 selected masters, SHA/dimensions/mode/web URI |
| `scripts/art-pipeline.ts` | Chọn revision cao nhất, xuất ảnh web, tạo catalog và validate |
| `src/client/art/catalog.json` |38 mappings presentation, không thuộc engine bundle |
| `src/client/art/registry.ts` | Lookup presentationAsset theo ID/kind |
| `public/art/a2/` |29 bản web, public catalog và gallery |

Receipt ghi trạng thái tại thời điểm tạo ảnh; các chuỗi như `generated-awaiting-technical-validation` là lịch sử của generation job. Kết quả kiểm tra sau đó nằm trong HANDOFF/PROGRESS và build manifest, không suy ra QA hiện tại từ một receipt riêng lẻ.

## Tạo và chỉnh ảnh

Dùng skill imagegen và built-in image_gen, một call/asset. Không cần API key; không tự chuyển CLI/API. Hướng hình: gritty supernatural apocalypse, chất liệu cũ, than/xanh dầu/ánh vàng/đỏ quỷ dị. Không vẽ UI/chữ/logo/watermark vào ảnh. Giữ bản gốc và revision sửa; kiểm tra ảnh nhìn được và metadata thay vì chỉ tin cờ transparency.

Xe tải master có 651.872 pixel alpha0, bus A1 có 608.414; bốn góc đều 0. Bản web alpha giữ được sau resize: bus154.209/truck 165.128 pixel alpha0 ở lần QA đã ghi. Các số này gắn với hash trong manifest, có thể đổi nếu rebuild preset.

## Build bản web — khi được phép tiếp tục

Hiện QA đang dừng theo HANDOFF; các lệnh sau là tài liệu tham khảo:

```sh
npm run art:build
npm run validate:art
```

art:build dùng Node 24 + macOS `/usr/bin/sips`; giữ master, chỉ resize/encode. Opaque→JPEG quality 84; max-edge map 1800, cảnh 1600, portrait 640, icon 320; vehicle→PNG max 768 để giữ alpha. Preset hiện tại có thể upscale map 1774 lên 1800; việc tránh upscale đã được cân nhắc nhưng chưa sửa. Không tự thay preset mà chưa đánh giá hash/QA.

Các file web được lưu trong repo nên game/build thông thường không cần sips trên Linux/Windows. Bản hiện tại29 web images khoảng 8.90 MiB, tải lazy theo màn hình; không phải tất cả cùng tải lúc mở game.

Validator kiểm tra ID/kind/coverage/URI/file, dimensions PNG/JPEG, SHA-256 và alpha channel. Pixel alpha0/decode đã dùng Pillow đọc metadata để QA, không dùng để vẽ lại ảnh. Chỉ channel alpha chưa chứng minh nền trong suốt; cần đối chiếu pixel thật nếu tạo xe mới.

## Tích hợp client

AssetArt lấy presentation override theo stable ID, sau đó fallback content registry/CSS khi lỗi. Skill thiếu assetId dùng `asset.<skill.id>` ở renderer. Portrait dùng CSS frame zoom mặt, giữ full master. Map art là SVG image nền; nodes/routes/chi phí vẫn từ data/engine, tọa độ art là presentation.

Menu dùng gara; event có mapping riêng/reuse; combat có environment + vehicle + portraits/icons; inventory có vehicle/artifacts. Action report hiện ở luồng trang để tránh phủ nút.

Gallery HTTP: `http://127.0.0.1:4173/art/a2/gallery.html`. File HTML đã nhúng JSON và ảnh tương đối; file:// chưa QA bằng browser tool vì policy không cho giao thức này. Không bypass; HTTP đã kiểm tra.

## Gate còn mở

Xem HANDOFF: mobile wrap nhãn/số, map pan/mobile cast, missing-image fallback chủ động, legacy browser load và final delivery report. Không generate lại assets đã đủ hoặc báo A2 hoàn tất trước khi chốt các bước được người dùng cho tiếp tục.

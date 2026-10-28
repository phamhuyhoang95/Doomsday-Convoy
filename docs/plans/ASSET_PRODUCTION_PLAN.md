# LAST CONVOY — sản xuất và tích hợp tài nguyên A2

**Trạng thái hiện tại:** A2.1–A2.3 đã có sản phẩm, A2.4 còn gate. Người dùng yêu cầu dừng test/QA để tổ chức AGENTS/docs trước. Đọc [HANDOFF](../ai/HANDOFF.md) và [PROGRESS](../status/PROGRESS.md); không tự tiếp tục QA dựa vào checklist bên dưới.

Ngày 2026-10-28. Người dùng yêu cầu tiến tới sản xuất sau bộ mẫu A1. Dùng skill imagegen, built-in image_gen; mỗi asset mới có một prompt/call riêng. Đọc lại PROGRESS trước khi tiếp tục sau reset.

## Danh mục và hướng hình ảnh

Mục tiêu **29 ảnh master**, gồm 4 ảnh A1 giữ lại và **25 ảnh mới**. Catalog client có **38 ID hình**: 1 map, 8 location, 12 event, 8 portrait, 4 skill, 2 artifact, 1 anomaly và 2 vehicle. Các event cùng bối cảnh dùng lại background có chủ đích; ba tình huống chính có illustration riêng.

| Nhóm | Sản xuất | Giữ từ A1 |
|---|---|---|
| Map | Dùng lại map, căn marker theo landmark | world-map |
| 8 địa điểm | Market, Overpass, Service, Hospital, Ward, Checkpoint, Refuge | Garage |
| 8 chân dung | Lan, Bảo, Hà, Quạ, Tàn, Kẻ Đói, Kẻ Rình | Minh |
| 4 kỹ năng | Strike, Heal, Guard, Sense; icon vuông đọc được ở kích thước nhỏ | — |
| 2 kỳ vật | Mắt gương, Đèn không tắt | — |
| 1 quỷ dị | Người gọi tên / tiếng chuông; illustration ngang | — |
| 2 xe | Xe tải Tro Tàn alpha | Xe khách alpha |
| Event riêng | Cứu Hà ở chợ, Hồ sơ bệnh nhân 07, Tro Tàn chặn đường | Các event còn lại dùng location/anomaly |

Style: dark supernatural apocalypse, minh họa bán hiện thực nhiều texture, bê tông vỡ/kim loại gỉ/vải cũ, bóng xanh dầu/than, ánh vàng ấm và đỏ quỷ dị có tiết chế. Mỗi địa điểm có silhouette riêng. Chân dung người Việt có tuổi/vóc dáng/vai trò phân biệt. Không có chữ/logo/HUD trong ảnh; UI vẫn render nhãn/chi phí/route/HP và điều khiển command thật.

## A2.1 — môi trường

1. Lưu jobs/prompts trước khi generate; chia batch 3–4 ảnh.
2. Tạo 7 location backgrounds ngang, một cảnh/địa điểm, bố cục có vùng yên cho crop UI.
3. Xem từng output, copy master về `art/production-a2/masters`, ghi result/status sau mỗi batch.

**Gate:** đủ 8 location khi tính Garage A1, PNG decode được, đúng scene/no text, cùng palette nhưng landmark phân biệt.

**Kết quả A2.1:** đã qua gate. Tạo7 PNG mới + Garage A1; Overpass/Service chọn revision2 đã cleanup bằng image_gen. Các bản đầu không được chọn cho catalog.

## A2.2 — nhân vật

1. Tạo 7 portrait dọc riêng từng người, khung ngực trở lên, mặt đủ lớn cho crop thumbnail.
2. Giữ Minh A1; medical/mechanic/radio/rival/scavenger có trang phục và khuôn mặt riêng.
3. Kiểm tra mặt/tay/đồ nghề, lưu master và metadata.

**Gate:** đủ 8 portrait, không nhầm nhân vật hoặc crop mất đầu; nhận ra được ở thumbnail.

**Kết quả A2.2:** đã tạo7 portrait mới + Minh A1, xem trực quan và giữ đúng ID/vai trò. Cần kiểm tra thumbnail/crop trong browser ở A2.4.

## A2.3 — icon, kỳ vật, quỷ dị, xe và event

1. Tạo riêng 4 skill icons, 2 artifact icons, 1 anomaly scene, 1 xe tải alpha và 3 event scenes.
2. Icon tập trung một vật/hành động lớn; không nhét typography vào hình.
3. Xác minh alpha xe bằng pixel data, không chỉ dựa vào preview; sửa bằng image_gen nếu không đạt.

**Gate:** 29 master đủ, có prompt/source/dimensions/hash, đúng 38 ID mapping (bao gồm event reuse).

**Kết quả A2.3:** đã đủ29 selected master và metadata. Tạo25 mới bằng built-in tool, reuse4 A1; 3 ảnh đã cleanup góc và chọn revision2. Xe tải có651.872 pixel alpha0, các góc0. `art:build` đã tạo29 web images8.90MiB, catalog38 ID và validate thành công.

## A2.4 — bản web và tích hợp

1. Giữ PNG master; tạo JPEG cho ảnh opaque, PNG nhỏ hơn cho alpha bằng resize/format conversion kỹ thuật. Ghi preset/lệnh; không ghi đè master. Công cụ build local dùng macOS sips; ảnh build được commit để app/CI không phụ thuộc sips.
2. Catalog presentation riêng trong client theo stable asset IDs, validator kiểm tra refs/file/dimensions/hash/coverage. Không đưa URI vào core hoặc thay content version/rules/save.
3. AssetArt ưu tiên catalog hình thật, vẫn fallback nếu file thiếu/lỗi. Nối menu/event/crew/combat/inventory/skill icons; map có background art, marker/route và xe overlay tương tác.
4. Kiểm tra desktop/mobile, tải save cũ, dùng skill/travel và missing-image fallback. Chạy validators, 103 tests hiện có, typecheck/build và ghi kết quả thực tế.
5. Cập nhật README/PROGRESS/report, commit/push thường, đối chiếu origin SHA.

**Done:** assets xuất hiện trong game thật, các control hoạt động; master + bản web + prompts + catalog được lưu và kiểm chứng. Chưa gồm animation nhân vật, sprite nhiều hướng, audio thu âm, redesign toàn bộ UI hoặc gameplay mới.

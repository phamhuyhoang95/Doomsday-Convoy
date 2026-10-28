# LAST CONVOY — trạng thái và điểm tiếp tục

**Cập nhật:** 2026-10-28, Asia/Saigon. **Ưu tiên mới nhất:** người dùng yêu cầu dừng test/QA để hoàn thiện AGENTS và thư mục docs trước.

Nguồn bàn giao chi tiết: [HANDOFF](../ai/HANDOFF.md). Mục lục: [docs/README](../README.md). Nhật ký dài cũ được bảo toàn tại [PROGRESS_HISTORY](PROGRESS_HISTORY.md); không lấy các dòng NEXT lịch sử làm chỉ dẫn hiện tại.

## Trạng thái hiện tại

| Hạng mục | Trạng thái |
|---|---|
| MVP Phase 0–5 | Hoàn tất, đã push; xem QA_REPORT lịch sử |
| R1 cải thiện gameplay | Hoàn tất; 103 tests và 2.400 runs ở checkpoint R1 |
| A1 mẫu mỹ thuật |4 ảnh, prompts/manifest, đã push `baac6ba` |
| A2 sản xuất ảnh | Đủ29 master được chọn (25 mới + 4 A1), có jobs/prompts/receipts |
| A2 web/catalog/client | Đã tích hợp local, 38 ID/29 web images ~8.90 MiB |
| A2 final QA/Git delivery | Chưa chốt; QA đang dừng theo người dùng |
| Kho docs/AGENTS | Đã tổ chức xong nội dung; lưu checkpoint để AI mới tiếp nhận |

## Gate có bằng chứng trước khi dừng QA

- `art:build` và art validator pass: 29 master / 38 mappings / 29 bản web; metadata/hash/refs/coverage/alpha channel hợp lệ.
- Full `npm run check` đã có lượt103 tests / 5 files pass, world/content/art validators, TS/Vite build pass. Có CSS cập nhật sau gate đó, chưa xác nhận lại snapshot mới nhất.
- Pixel/decode QA xác nhận29 web images hợp lệ, hai xe giữ alpha0 ở bốn góc. Browser dev Phá giáp 33 HP làm đối thủ40→7 và đổi lượt đúng; menu/map/portraits hiện trong production khi tải autosave R1.
- Gallery HTTP lọc đúng 8 portrait. Mobile390 × 844 đã xem crew/combat art, chưa chốt hết flow. Missing-image fallback/legacy browser A2 chưa kiểm tra chủ động.
- Không có tiến trình check/test được phát hiện khi nhận yêu cầu dừng. Không chạy thêm test/build/browser QA trong đợt tổ chức docs.

## Việc đã đổi trong đợt docs

- AGENTS root là điểm vào có thứ tự đọc, quy tắc kiến trúc/compatibility/art/testing/Git và hướng dẫn bàn giao.
- Tài liệu chính thức chuyển vào docs/ai, game, engineering, assets, plans, reports, status. Các đường dẫn root cũ giữ forwarding links.
- Tạo START_HERE/HANDOFF/PROJECT_MAP/DECISIONS/WORKFLOW và ASSET_PIPELINE để AI mới có thể tiếp tục từ filesystem.
- Lưu nguyên nhật ký cũ làm lịch sử, thay trang progress chính bằng trạng thái ngắn gọn hiện tại.

## Bước tiếp theo

Chờ người dùng yêu cầu tiếp tục A2/QA. Khi có, làm checklist HANDOFF; không tạo lại ảnh, không xây lại engine, không tự mở animation/gameplay mới. Lấy Git status/log làm nguồn chính xác về WIP/commit/push của checkpoint docs, không đoán từ việc file có trong workspace.

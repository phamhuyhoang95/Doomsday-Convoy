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
| A2 final QA/Git delivery | Hoàn tất; 29 ảnh master / web / catalog đã sync |
| Kho docs/AGENTS | Đã tổ chức xong nội dung; lưu checkpoint để AI mới tiếp nhận |
| R2 & R3 Đại tu toàn diện | Hoàn tất: Giao diện Scene-Centric (không cuộn trang), Lượt đấu so le kẻ địch phản công thực sự, Ý đồ báo trước (Enemy Intents), Banner phản đòn, Nhạc nền BGM Web Audio tự tổng hợp, Narrative grimdark, Anomaly suy luận |

## Gate có bằng chứng R3

- `npm run check` trên Node 24: 103/103 tests pass (5 test suites), world/content/art validators pass, TypeScript strict pass, Vite production build thành công.
- `npm run simulate:campaign -- --seeds 100`: 800/800 campaign runs qua 8 bộ chính sách, 0 softlocks, 0 rejected commands, 800 save/load checks pass, 800 replay verified runs pass với lượt đấu so le.
- Ảnh chụp màn hình thực tế: `artifacts/r3_*.png` và slide carousel [overhaul_combat_and_ui.md](../artifacts/overhaul_combat_and_ui.md).

## Việc đã đổi trong đợt docs

- AGENTS root là điểm vào có thứ tự đọc, quy tắc kiến trúc/compatibility/art/testing/Git và hướng dẫn bàn giao.
- Tài liệu chính thức chuyển vào docs/ai, game, engineering, assets, plans, reports, status. Các đường dẫn root cũ giữ forwarding links.
- Tạo START_HERE/HANDOFF/PROJECT_MAP/DECISIONS/WORKFLOW và ASSET_PIPELINE để AI mới có thể tiếp tục từ filesystem.
- Lưu nguyên nhật ký cũ làm lịch sử, thay trang progress chính bằng trạng thái ngắn gọn hiện tại.

## Bước tiếp theo

Chờ người dùng yêu cầu tiếp tục A2/QA. Khi có, làm checklist HANDOFF; không tạo lại ảnh, không xây lại engine, không tự mở animation/gameplay mới. Lấy Git status/log làm nguồn chính xác về WIP/commit/push của checkpoint docs, không đoán từ việc file có trong workspace.

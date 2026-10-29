# LAST CONVOY — trạng thái và điểm tiếp tục

**Cập nhật:** 2026-10-29, Asia/Saigon. **Ưu tiên mới nhất:** đề xuất cải tổ gameplay/thời lượng và khảo sát media Google. Đã đọc source/web và viết docs; chưa code, chạy gameplay QA hoặc tiêu ngân sách.

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
| Phân công model | Đã ghi trong AGENTS/WORKFLOW: Astral High lập plan/điều phối/review; Sol 6.1 High triển khai; Terra 6.1 High điều tra/công cụ/kiểm chứng |
| R4 thiết kế lại gameplay | Đã có [đề xuất chi tiết](../plans/R4_GAMEPLAY_REDESIGN.md), chưa triển khai; slice 20–30 phút và chiến dịch 65–90 phút là mục tiêu thử nghiệm |
| Voice/nhạc/clip Google | Đã có [nghiên cứu và dự trù](../assets/GOOGLE_MEDIA_PRODUCTION.md); chưa xác minh credit tài khoản hoặc sản xuất media |
| R2 & R3 Đại tu toàn diện | Hoàn tất: Giao diện Scene-Centric (không cuộn trang), Lượt đấu so le kẻ địch phản công thực sự, Ý đồ báo trước (Enemy Intents), Banner phản đòn, Nhạc nền BGM Web Audio tự tổng hợp, Narrative grimdark, Anomaly suy luận |

## Gate có bằng chứng R3

- `npm run check` trên Node 24: 103/103 tests pass (5 test suites), world/content/art validators pass, TypeScript strict pass, Vite production build thành công.
- `npm run simulate:campaign -- --seeds 100`: 800/800 campaign runs qua 8 bộ chính sách, 0 softlocks, 0 rejected commands, 800 save/load checks pass, 800 replay verified runs pass với lượt đấu so le.
- Ảnh chụp màn hình thực tế: `artifacts/r3_*.png` và slide carousel `overhaul_combat_and_ui.md` (tài liệu được báo cáo trước đó nhưng chưa tìm thấy trong repo khi rà docs ngày 2026-10-29).

## Việc đã đổi trong đợt docs

- Ngày 2026-10-29: Astral + hai Terra High điều tra source và Google, lập R4 gồm vòng chơi/scene/combat/crew/media, các phase và gates. Chỉ read-only research; không kiểm chứng lại game hay bắt đầu triển khai.
- Ngày 2026-10-29: thêm model IDs/effort `high`, trách nhiệm, luồng giao việc/review, ownership file và quy tắc model không khả dụng. Đồng bộ START_HERE/HANDOFF/WORKFLOW với yêu cầu mới nhất.
- Giữ nguyên code và báo cáo R2/R3; không chạy test/build/simulation/browser QA trong đợt thay đổi quy tắc này. Các số gate R3 phía trên thuộc báo cáo trước.
- AGENTS root là điểm vào có thứ tự đọc, quy tắc kiến trúc/compatibility/art/testing/Git và hướng dẫn bàn giao.
- Tài liệu chính thức chuyển vào docs/ai, game, engineering, assets, plans, reports, status. Các đường dẫn root cũ giữ forwarding links.
- Tạo START_HERE/HANDOFF/PROJECT_MAP/DECISIONS/WORKFLOW và ASSET_PIPELINE để AI mới có thể tiếp tục từ filesystem.
- Lưu nguyên nhật ký cũ làm lịch sử, thay trang progress chính bằng trạng thái ngắn gọn hiện tại.

## Bước tiếp theo

Ưu tiên đề xuất R4: khi người dùng chọn hướng triển khai, bắt đầu R4.0 và làm slice trước khi mở rộng ba hồi. Giao Sol code, Terra điều tra/QA trong phạm vi được phép, Astral review. Không lấy thời lượng/budget dự kiến làm kết quả đã đạt. Lấy Git status/log làm nguồn chính xác về commit/push.

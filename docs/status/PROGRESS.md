# LAST CONVOY — tiến độ hiện tại

**Checkpoint 2026-10-29 — Argon O0/O1 đã tích hợp, đang chờ duyệt hình/nhạc:** Người dùng đã yêu cầu “bắt đầu triển khai đi”; được sửa code/art và chạy QA cho phần thay đổi. Đã có combat mới + shell/scene/map/stage, atlas/nền mới, nhạc Gemini và sequencer. Bundle `0.2.0-campaign.1-argon`, legacy resolver giữ nguyên, slot mới tách riêng. [Báo cáo triển khai](../reports/ARGON_O1_IMPLEMENTATION.md).

- Gate thật Node24.14.0: full check 118 tests rồi bổ sung reflection/revive; cuối **120 tests pass**, strict TS/build pass. 96 Argon simulation runs: 72 thắng/24 thua chủ đích, 0 softlock/rejected, 96 save/load/replay. Không chạy lại batch lớn nếu không có thay đổi liên quan.
- Browser: 1280×720, 1920×1080, 390×844; skill/heal/swap/save-load/skip/thắng/bắt giữ/về scene, module/thoát nhiệm vụ, atlas fallback. Audio playback kỹ thuật đạt; chưa duyệt cảm nhận mix/loop hoặc hiệu năng thiết bị thật.
- Source chính `src/combat/tactical-*`, `src/content/argon.ts`, `src/client/argon/`, App/use-game/audio. Media/prompt/master/manifest nằm `art/argon-o1/`, bản web `public/`. Preset QA chỉ dev, command thật; server demo 5180 là origin riêng.
- **Chưa hoàn tất toàn bộ đại tu.** Crew/inventory/journal/ScenarioScene còn tái dùng component/CSS; O2 thay sâu, O3/O4 progression/content còn chưa làm. Không báo đã đủ mọi yêu cầu Argon.
- Git: phần đã đánh giá được đưa vào checkpoint triển khai; đối chiếu git log/status và origin để xác định SHA/trạng thái đồng bộ. `docs 2/` và ZIP đầu vào giữ nguyên, không đưa vào commit tự động.
- Bước đầu phiên tiếp: đọc báo cáo/plan, git status/diff, tiếp tục feedback visual/audio O1 → O2; không quay về plan UI-only. QA hiện được phép cho phần đang triển khai; không coi ghi chú dừng QA lịch sử bên dưới là lệnh hiện tại.

## Nhật ký trước checkpoint triển khai (lịch sử)

**2026-10-29 — bắt đầu triển khai Argon O0/O1:** Người dùng đã yêu cầu triển khai; mở kiểm chứng cho phần thay đổi. Đang xây bundle/luật combat mới, bảo toàn resolver legacy và dựng UI/asset cho trận đầu; chưa có gate mới hoặc phần đã nghiệm thu tại checkpoint bắt đầu này.

**2026-10-29 — nguồn media:** Người dùng xác nhận vẫn có Google AI Pro; đã cập nhật media plan ưu tiên Gemini tạo nhạc và Flow tạo clip qua quyền sẵn có, trước phương án API. Chỉ tra nguồn và cập nhật docs; chưa vào tài khoản, kiểm tra số dư, tạo output hoặc tiêu credit; chưa có gate runtime/media mới.

**2026-10-29 — bổ sung phương án media/độ phủ:** Đã lập [ARGON_MEDIA_PLAN](../assets/ARGON_MEDIA_PLAN.md) và ma trận yêu cầu trong §9 [plan đại tu](../plans/ARGON_COMBAT_UI_OVERHAUL.md). Đề xuất art/animation/effects/SFX/ambience/nhạc vào cùng đợt combat/UI, có gate O1; voice/clip phụ thuộc nguồn sản xuất. Khả thi về kỹ thuật, spec/content/asset chưa hoàn thiện và chưa triển khai.

- Đã kiểm tra source audio: đang dùng Web Audio tổng hợp; tìm dưới `public/`/`art/` chưa thấy file audio/video/atlas/sprite theo các pattern ghi trong media plan. Không suy ra media đã được sản xuất từ docs Google lịch sử.
- Tra nguồn chính thức Pixi filters, Web Audio/autoplay và TTS vi-VN; chưa xác nhận tài khoản, quota, billing, bảng giá/credit video/nhạc. Chưa gọi tạo media hoặc dịch vụ trả phí.
- Phiên này chỉ cập nhật docs; không runtime gate, chưa test/build/validator/simulation/browser QA, gen/tải media hoặc cài dependencies. Chưa commit/push.

**2026-10-29 — định hướng đại tu mới nhất:** Người dùng muốn thay UI cũ và hệ chiến đấu theo Argon. Đã ghi [phương án đại tu combat/UI](../plans/ARGON_COMBAT_UI_OVERHAUL.md), thay phạm vi đích UX1 UI-only trước đó. Đây là checkpoint lập phương án, chưa triển khai code/art.

- Đối chiếu `src/combat/state.ts`, resolver và persistence hiện tại; plan đề xuất combat có đội hình/status/combo/kỳ vật/xe, thời gian combat tách world tick, frontend mới hoàn toàn và đường legacy giữ luật cũ.
- Bước đầu triển khai đề nghị là O0 contract/asset manifest → O1 một trận mới thật; các hệ/content còn lại chia đợt theo plan. Các chi tiết rules là đề xuất chưa nghiệm thu.
- Không có test/build/validator/simulation/browser QA hoặc ảnh mới trong phiên lập phương án; không có runtime gate mới. Docs đang WIP, chưa commit/push.

## Review trước khi đổi phạm vi sang đại tu

**2026-10-29 — checkpoint review mới nhất:** Đã review bộ đề xuất Argon `docs 2/` và đủ 7 concept, đối chiếu source/assets trên HEAD `6955279`. [Báo cáo chi tiết](../reports/CONCEPT_REDESIGN_REVIEW.md) đề xuất ưu tiên làm lại UI theo concept trên gameplay R4.1 trước khi mở rộng systems. Chưa sửa code, tạo ảnh, cài dependencies hoặc triển khai redesign; chưa commit/push docs review.

- Đã xác định các điểm cần chốt: baseline cũ của plan nhập, thiếu asset combat toàn thân, API sequencer/RNG không khớp, rules/chi phí/topology chưa nhất quán và rủi ro lộ world facts qua radar.
- Ảnh R4 mobile có sẵn còn cắt ngang nội dung; một số artifact tên combat hiển thị map. Không dùng các ảnh này để chứng nhận responsive/combat hiện tại đã đạt.
- Phiên này chỉ đọc source/tài liệu/JSON và xem ảnh có sẵn; không chạy test/build/validator/simulation/browser QA. Các gate R4.1 dưới đây là ghi nhận lịch sử, chưa tái xác minh.
- Bước tiếp khi được yêu cầu triển khai: plan UX1 + manifest asset + một scene/event thật và mobile. `docs 2/`/ZIP được giữ như đầu vào tham khảo, không ghi đè tài liệu chính thức.

## Checkpoint triển khai R4.1 trước phiên review

**2026-10-29:** Đã ghi nhận triển khai R4.1 — Slice nhiệm vụ hiện trường "Chợ mất điện" (Market Blackout) theo kế hoạch [R4_GAMEPLAY_REDESIGN](../plans/R4_GAMEPLAY_REDESIGN.md).

- **Nhiệm vụ hiện trường tương tác (Scenario Slice)**:
  - Bản đồ đồ thị 5 điểm tương tác: Bãi đỗ xe tải, Dãy sạp hàng & Cổng chợ, Trạm biến áp & Phòng điện, Kho hàng & Xe bán tải, Buồng quản lý phía sau.
  - Phân công đội hình có vai trò thực sự: Chọn 2 người ra ngoài hiện trường, 1 người giữ xe tải canh chừng máy nổ. Bảo (Thợ máy) đấu dây ngầm không gây tiếng động (0 cảnh giới); Minh bọc lót; Lan sơ cứu.
  - Thang cảnh giới (Alert Meter 0–6): Hành động ồn ào hoặc nổ máy phát tăng cảnh giới; cảnh giới cao kích hoạt toán cướp bao vây.
  - Sức chứa ba-lô có hạn (Tối đa 2 kiện hàng): Người chơi phải đánh đổi giữa can xăng 15L, hòm phế liệu, máy phát điện cầm tay hoặc giải cứu người.
  - Giải cứu nhân vật Hà: Mở khóa cửa buồng quản lý bằng cách cấp điện hoặc cạy chốt; khi hoàn tất, Hà chính thức gia nhập đoàn xe.
  - 3 hướng giải quyết khủng hoảng: Chiến đấu trực diện (Combat), Nghi binh đánh lạc hướng bằng hàng/xăng (Decoy), hoặc Húc rào rút lui khẩn cấp (Evacuate -10% xe).
  - 2 Module xe thực sự tác động lên chặng đường tiếp theo:
    - `module.fuel-tank`: Giảm vĩnh viễn 20% lượng tiêu hao nhiên liệu trên mọi cung đường di chuyển.
    - `module.triage-unit`: Tự động hồi phục 6 HP cho thuyền viên bị thương sau mỗi chuyến di chuyển.
- **Trình diễn giao diện Scene-Centric (`ScenarioScene.tsx`)**:
  - Nền ảnh hiện trường đêm `market-blackout.jpg` với hệ thống hotspot tương tác theo tọa độ chuẩn.
  - Top HUD hiển thị thanh Cảnh giới chuyển màu cảnh báo, 2 ô Ba-lô chứa đồ, Trạng thái điện lưới, Trạng thái cứu Hà, và phân công nhân sự.
  - Bảng Briefing phân công người trước khi xuất kích và Debriefing lựa chọn module nâng cấp xe khi hoàn tất.
  - Modal Khủng hoảng báo động đỏ bao trùm màn hình khi bị toán cướp phát hiện.
- **Bảo toàn tương thích tuyệt đối**:
  - Không phá vỡ bất kỳ save/replay lịch sử nào (`0.1.0-campaign.4` trong `v01-saves.json` và `.5-r1` trong `r3-current-saves.json`).
- **Kiểm chứng thực tế**:
  - `npm run check`: 106/106 tests pass (6 files, bao gồm `tests/scenario.test.ts`), tất cả validators pass, TypeScript strict pass, Vite production build pass.
  - `npm run simulate:campaign -- --seeds 100`: 800/800 campaign runs qua 8 bộ chính sách đều đạt kết quả hợp lệ, 0 softlocks, 0 rejected commands, 800 save/load checks pass, 800 replay checks pass.
  - Browser QA: Đã kiểm tra và chụp ảnh thực tế desktop (1280x900) và mobile (390x844) tại `artifacts/r4_*.png`.

---

## Checkpoint lịch sử trước R4

| Hạng mục | Trạng thái |
|---|---|
| MVP Phase 0–5 | Hoàn tất, đã push |
| R1 cải thiện gameplay | Hoàn tất; 103 tests và 2.400 runs ở checkpoint R1 |
| A1 mẫu mỹ thuật | 4 ảnh, prompts/manifest, đã push `baac6ba` |
| A2 sản xuất ảnh | Đủ 29 master được chọn (25 mới + 4 A1), có jobs/prompts/receipts |
| A2 web/catalog/client | Đã tích hợp local, 38 ID/29 web images ~8.90 MiB |
| R2 & R3 Đại tu toàn diện | Lượt đấu so le kẻ địch phản công, Enemy Intents, Banner phản đòn, Nhạc nền BGM Web Audio, Scene-Centric UI |
| R4.1 Nhiệm vụ Chợ mất điện & Module xe | Hoàn tất: 106 tests pass, 800 simulation runs pass, Scene UI & Browser QA pass |

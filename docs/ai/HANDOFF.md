# Bàn giao hiện tại

**Checkpoint 2026-10-29 — Argon O0/O1 đã tích hợp, đang chờ duyệt hình/nhạc:** Người dùng đã yêu cầu “bắt đầu triển khai đi”; được sửa code/art và chạy QA cho phần thay đổi. Đã có combat mới + shell/scene/map/stage, atlas/nền mới, nhạc Gemini và sequencer. Bundle `0.2.0-campaign.1-argon`, legacy resolver giữ nguyên, slot mới tách riêng. [Báo cáo triển khai](../reports/ARGON_O1_IMPLEMENTATION.md).

- Gate thật Node24.14.0: full check 118 tests rồi bổ sung reflection/revive; cuối **120 tests pass**, strict TS/build pass. 96 Argon simulation runs: 72 thắng/24 thua chủ đích, 0 softlock/rejected, 96 save/load/replay. Không chạy lại batch lớn nếu không có thay đổi liên quan.
- Browser: 1280×720, 1920×1080, 390×844; skill/heal/swap/save-load/skip/thắng/bắt giữ/về scene, module/thoát nhiệm vụ, atlas fallback. Audio playback kỹ thuật đạt; chưa duyệt cảm nhận mix/loop hoặc hiệu năng thiết bị thật.
- Source chính `src/combat/tactical-*`, `src/content/argon.ts`, `src/client/argon/`, App/use-game/audio. Media/prompt/master/manifest nằm `art/argon-o1/`, bản web `public/`. Preset QA chỉ dev, command thật; server demo 5180 là origin riêng.
- **Chưa hoàn tất toàn bộ đại tu.** Crew/inventory/journal/ScenarioScene còn tái dùng component/CSS; O2 thay sâu, O3/O4 progression/content còn chưa làm. Không báo đã đủ mọi yêu cầu Argon.
- Git: phần đã đánh giá được đưa vào checkpoint triển khai; đối chiếu git log/status và origin để xác định SHA/trạng thái đồng bộ. `docs 2/` và ZIP đầu vào giữ nguyên, không đưa vào commit tự động.
- Bước đầu phiên tiếp: đọc báo cáo/plan, git status/diff, tiếp tục feedback visual/audio O1 → O2; không quay về plan UI-only. QA hiện được phép cho phần đang triển khai; không coi ghi chú dừng QA lịch sử bên dưới là lệnh hiện tại.

## Nhật ký trước checkpoint triển khai (lịch sử)

**Yêu cầu thực thi hiện tại:** Người dùng đã nói “bắt đầu triển khai đi”. Bắt đầu O0/O1 theo plan đại tu: được sửa code, tạo asset cần thiết và chạy test/build/validator/browser QA cho phần thay đổi. Các ghi chú “chỉ lập phương án/chưa cho QA” bên dưới là lịch sử. Tiếp tục công việc được giao, không hỏi lại quyền bắt đầu.

**Nhắc lại nguồn media mới nhất:** Người dùng xác nhận vẫn có Google AI Pro. Đã cập nhật [media plan](../assets/ARGON_MEDIA_PLAN.md) để ưu tiên tạo nhạc trên Gemini và clip trên Flow bằng quyền sẵn có trước khi tính API. Đã tra Help chính thức về tạo/tải nhạc và Flow Pro credits, chưa kiểm tra số dư/đăng nhập riêng; chưa tạo output, tiêu credit, bật billing hoặc sửa code. Không yêu cầu mua thêm dịch vụ chỉ vì tools trong phiên không có generator audio/video.

**Bổ sung mới nhất 2026-10-29 — độ phủ Argon và media:** Người dùng hỏi toàn bộ yêu cầu Argon có khả thi chưa, ảnh/âm thanh/animation có làm trong đợt này và phương án. Đã thêm ma trận phủ yêu cầu vào §9 [plan đại tu](../plans/ARGON_COMBAT_UI_OVERHAUL.md) và lập [ARGON_MEDIA_PLAN](../assets/ARGON_MEDIA_PLAN.md).

- Kết luận: khả thi về kỹ thuật nhưng chưa đủ spec/asset để code nguyên văn hoặc tuyên bố hoàn tất. Đề xuất art, pose animation, effects, SFX, ambience/nhạc thuộc gói cơ sở và gate ngay O1; voice chọn lọc/clip tùy nguồn sản xuất, không hứa full voice-over/frame animation.
- Hiện audio tổng hợp trong `src/client/audio.ts`; tìm mp3/ogg/wav/mp4/webm/atlas/sprite dưới `public/` và `art/` chưa có kết quả. Tools hiện bật không có generator nhạc/voice/video chuyên dụng. Cloud TTS vi-VN đã tra nguồn chính thức, chưa xác minh tài khoản/billing hoặc gọi dịch vụ.
- Làm rõ câu trả lời framework trước: không cần một game engine mới; để đạt full shader Argon, đề nghị React HUD + Pixi stage/effects + một sequencer. Chưa cài package, không biến câu “React đủ” thành lý do bỏ hiệu ứng đích.
- Phiên này vẫn chỉ nghiên cứu/lập phương án/cập nhật docs; chưa gen/tải media/sửa code/cài dependency/chạy QA hoặc commit/push. Bước tiếp O0 gồm cả rules contract và inventory/media brief/source lựa chọn, rồi O1 trận hoàn chỉnh có hình/âm đại diện.

**Định hướng mới nhất 2026-10-29:** Người dùng hỏi phương án loại bỏ UI cũ và thay cả hệ thống chiến đấu + giao diện mới hoàn toàn theo Argon. Đã lập [ARGON_COMBAT_UI_OVERHAUL](../plans/ARGON_COMBAT_UI_OVERHAUL.md); mục tiêu đích chuyển sang đại tu combat/UI, không còn UX1 UI-only.

- Plan đề xuất đội hình trước/sau, action economy, status/combo/pathway/kỳ vật/xe và tách combat round khỏi giờ hành trình; các chi tiết này là đề xuất, chưa phải luật đã triển khai hoặc đã được người dùng chốt từng mục.
- Giữ nền deterministic/processCommand/persistence; bundle mới có luật mới, legacy/R4 cần giữ semantics và được trình bày bằng UI mới thích hợp. Không xóa engine/content/save cũ để “loại bỏ UI cũ”.
- Phiên hiện tại chỉ lập phương án và cập nhật docs, chưa sửa source, cài dependencies, gen hoặc chạy test/build/validator/simulation/browser QA; chưa commit/push. Đầu vào `docs 2/`/ZIP và WIP review trước được giữ nguyên.
- Bước tiếp khi bắt đầu triển khai: O0 combat/time/compatibility contract + asset manifest, rồi O1 một trận mới hoàn chỉnh cùng UI/asset; không tự quay lại UX1 hoặc thực thi nguyên văn plan R2 nhập vào.

## Yêu cầu review trước khi đổi hướng

**Cập nhật 2026-10-29 — yêu cầu mới nhất:** Người dùng đưa bộ đề xuất Argon trong `docs 2/` và 7 ảnh `docs 2/concepts/`, yêu cầu review tính khả thi và đề xuất trước khi làm lại giao diện theo concept. Đã hoàn tất review source/tài liệu/ảnh có sẵn trên HEAD `6955279`; **chưa triển khai redesign**.

- Báo cáo: [CONCEPT_REDESIGN_REVIEW](../reports/CONCEPT_REDESIGN_REVIEW.md). Khuyến nghị ưu tiên UX1 trên gameplay R4.1, tách gameplay mở rộng khỏi việc làm lại UI.
- Findings chính: baseline của gói nhập cũ; không ghi đè `docs/`; thiếu full-body combat art; sequencer/RNG mẫu không khớp API thật; rules bệnh viện mâu thuẫn; kinh tế/veto/hidden routes cần đặc tả và kiểm chứng thêm. Ảnh R4 mobile đã lưu còn cắt ngang, một số ảnh mang tên combat thực tế là map.
- Quyền/phạm vi phiên này: chỉ review và cập nhật docs; không chạy test/build/validator/simulation/browser QA hoặc tạo ảnh. Không coi yêu cầu review là yêu cầu thực thi 5 pha R2 hay cài dependencies.
- Git: source tracked ban đầu sạch; `docs 2/` và ZIP đầu vào chưa tracked, giữ nguyên. Phiên review cập nhật báo cáo, mục lục, HANDOFF/PROGRESS; chưa commit/push các thay đổi review.
- Bước tiếp khi người dùng yêu cầu triển khai: viết plan UX1, kiểm kê asset thiếu, dựng một scene/event thật cùng bố cục mobile để review. Không tự chuyển sang R4.2 hoặc chạy lại QA từ backlog cũ.

## Checkpoint triển khai trước yêu cầu review

**Ghi nhận trước phiên review:** Đã triển khai và ghi nhận kiểm chứng R4.1 — Slice nhiệm vụ hiện trường "Chợ mất điện" (Market Blackout) và Module xe theo yêu cầu `@docs/plans/R4_GAMEPLAY_REDESIGN.md`. Các gate bên dưới là báo cáo checkpoint cũ, không chạy lại trong phiên review concept.

## Những gì đã làm và hoàn tất trong đợt R4.1

1. **Lõi Engine & Dữ liệu Nhiệm vụ Hiện trường (Scenario Expedition Engine)**:
   - Schema định nghĩa: `src/scenario/schema.ts` với `scenarioPhaseSchema`, `scenarioActionSchema`, `scenarioNodeSchema`, `scenarioDefinitionSchema`, `scenarioStateSchema`.
   - Lệnh gameplay mới: `scenario-start`, `scenario-move`, `scenario-act`, `scenario-crisis`, `scenario-finish` trong `src/core/commands.ts`.
   - Domain Event: `scenario.event` trong `src/core/events.ts`.
   - Tích hợp Engine & Processor: `src/core/processor.ts`, `src/scenario/engine.ts`, `src/content/scenarios.ts`.
   - Thang cảnh giới (Alert 0–6), sức chứa ba-lô có hạn (tối đa 2 kiện hàng: Xăng, Phế liệu, Máy phát điện).
   - Giải cứu Hà đưa vào danh sách thuyền viên sống sót; mở khóa các hướng thoát thân khi bị toán cướp bao vây.
2. **2 Module xe nâng cấp có hiệu lực thực sự**:
   - `module.fuel-tank`: Giảm vĩnh viễn 20% chi phí tiêu hao nhiên liệu trên mọi cung đường di chuyển (`src/world/travel.ts`).
   - `module.triage-unit`: Tự động hồi phục 6 HP cho thuyền viên bị thương sau mỗi chuyến di chuyển (`src/core/processor.ts`).
3. **Giao diện hiện trường Scene-Centric (`ScenarioScene.tsx`)**:
   - Nền cảnh đêm `public/art/r4/market-blackout.jpg` với 5 điểm tương tác (Bãi đỗ xe tải, Dãy sạp hàng & Cổng chợ, Trạm biến áp & Phòng điện, Kho hàng & Xe bán tải, Buồng quản lý phía sau).
   - HUD thời gian thực: Cảnh giới (Alert meter), Ba-lô (Cargo slots), Điện lưới, Trạng thái cứu Hà, Đội hình ngoài / Giữ xe.
   - Briefing Panel phân công nhân sự trước khi xuất kích; Debriefing Panel tổng kết và chọn Module nâng cấp xe.
   - Crisis Dialog báo động đỏ với 3 lựa chọn (Chiến đấu trực diện, Nghi binh đánh lạc hướng, Húc rào rút lui khẩn cấp).
   - Thẻ lời mời tham gia nhiệm vụ tại Chợ sơ tán trên bản đồ chính.
4. **Bảo toàn tính xác định và tương thích ngược**:
   - Các bản lưu cũ `0.1.0-campaign.4` trong `v01-saves.json` và `.5-r1` trong `r3-current-saves.json` tiếp tục đạt 100% byte-for-byte tương đương khi replay và save/load.
5. **Bằng chứng kiểm chứng**:
   - `npm run check`: 106/106 tests pass (6 test suites bao gồm `tests/scenario.test.ts`), validators pass, TypeScript strict pass, Vite production build pass.
   - `npm run simulate:campaign -- --seeds 100`: 800/800 campaign runs qua 8 chính sách, 0 softlocks, 0 rejected commands, 800 save/load checks pass, 800 replay checks pass.
   - Bằng chứng hình ảnh: `artifacts/r4_scenario_desktop.png`, `r4_scenario_mobile.png`, `r4_scenario_crisis.png`, `r4_scenario_briefing.png`, `r4_scenario_debrief.png`.

## Backlog R4 — không phải lệnh hiện tại
- Khi người dùng sẵn sàng, tiếp tục phát triển R4.2 (Sân đấu chiến đấu có vị trí, AP và mục tiêu phong phú hơn) hoặc mở rộng các nhiệm vụ hiện trường tiếp theo (Bệnh viện, Trạm dịch vụ).

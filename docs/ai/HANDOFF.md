# Bàn giao hiện tại

**2026-10-29 — Resonance đã triển khai, clip Flow có tham chiếu đã tích hợp.** Người dùng yêu cầu hệ thống hóa màn chơi, lore nguồn gốc tận thế/quỷ dị, skill con đường siêu phàm; sau đó yêu cầu dùng ảnh/context dự án cho cinematic. Người dùng đã đồng ý quyền upload hai ảnh game và tự lưu master720p khi download automation lỗi. [Báo cáo](../reports/RESONANCE_IMPLEMENTATION.md), [plan](../plans/LORE_CHAPTERS_PATHWAYS.md), [canon](../game/LORE_BIBLE.md).

- **Chức năng:** 3 chương trên8địa điểm, 6 hồ sơ có nguồn/gate khám phá, 6 event mới (22 tổng); 4 con đường×3bậc9→8→7, 12 skill và nghi thức command0giờ dùng XP khả dụng/di vật/vật tư. XP tích lũy/điểm training giữ nguyên. Battle operator thật: giáp/phản, choáng seeded, xác, đổi chỗ/né, hỗ trợ xe, đảo sát thương. Chưa có lai ngạch/tha hóa/bậc6→0/map mới/ending chân lý.
- **Version:** new game `0.3.0-campaign.1-resonance`, slots `resonance-*`; nút tải Journey cũ `journey-*`, giữ O1/R1/.4. State/save v3, engine0.1.0, fields additive; không migrate ngầm. Source `src/content/resonance.ts`, `pathways.ts`, `src/occult/`, `src/read-models/campaign.ts`, UI Pathways/Lore/OpeningCinematic.
- **Media:** clip mở đầu Flow8.042s,1280×720,AAC stereo; `vehicle.bus.png`+`market-stage.jpg` làm tham chiếu. Flow UI báo Omni1.1Flash, 12credits/output, đã duyệt2output tổng24credits (thử text-only và bản tham chiếu); không xác minh biến động số dư, không top-up/billing. Master/prompt/receipt/hash ở `art/flow-cinematics/`; web~2.82MB/poster `public/video/resonance/`; script `scripts/prepare-flow-opening.py`. Giữ watermark. Clip mới có new-game/replay/skip/ESC/timeout/fallback; travel Journey composition cũ vẫn giữ, chưa có phim riêng từng chương.
- **Gate cuối Node24.14.0:** `npm run check` **146/146tests,9files**, validators/strictTS/build pass; Vitest8.93s,Vite9.62s.17tests Resonance kiểm tra progression/lore/operators/save/replay.48runs:36thắng/12thua chủ đích,0softlock/rejected,48save/load/replay. Hash master/web/poster/reference và syntaxscript đã kiểm. Cuối chỉ đồng bộ tên/miêu tả sơ cứu giữa hai read model và format, stricttypecheck pass. Timeout đầu phiên và baseline đối chiếu được giữ trong báo cáo; không đổi timeout để pass, full gate cuối đã đạt.
- **Browser origin QA5180:** thức tỉnh trừ đúng tài nguyên/XP khả dụng, không đổi giờ; lưu/tải giữ pathway và xác minh replay. Hồ sơ khóa không lộ title/body; mobile390×844 không tràn ngang. Skill gương đổi Minh/Lan thật, có né; clip local phát `paused=false/readyState4`, mute đúng, skip/auto-return/404fallback; ảnh `artifacts/resonance-*`. Chưa thử reduced-motion cấp hệ điều hành/điện thoại thật; audio đã giữ stream, còn nghe duyệt mix. Chưa duyệt cảm giác/cân bằng qua human playtest.
- **Git:** implementation/media **`c8d1749` đã commit/push origin/main**, SHA remote đối chiếu đúng. Bản cập nhật HANDOFF/PROGRESS này ở commit docs tiếp. `docs 2/` và ZIP đầu vào giữ nguyên/chưa tracked, không đưa vào commit.
- **Bước tiếp:** đọc báo cáo và Git; thử new game → clip → gara/radio/sổ tay → SIÊU PHÀM, HỒ SƠ. Tiếp nhận playtest nhịp truyện/kinh tế/balance trước mở slice kế; cinematic bệnh viện/Bắc Sơn cần shot list+art tương ứng. Không gen lại A2 hoặc bản Flow đã chọn, không chạy lại batch lớn nếu không có thay đổi/lo ngại mới. QA/code trong scope tiếp tục được phép; không coi ghi chú dừng QA lịch sử là lệnh hiện tại.

## Checkpoint trước Resonance — lịch sử

**2026-10-29 — phản hồi hành trình/auto đã triển khai:** Người dùng đánh giá combat ổn hơn nhưng xe chuyển nơi đột ngột, lựa chọn cụt/dễ đoán và muốn auto. Đã có clip travel 5.2s/skip/fallback + tiếng máy, AUTO có stop/load/aftermath boundaries, và 4 event liên địa điểm với điều tra/hậu quả trả sau. Đã sửa leak mô tả manh mối qua nút khóa. [Báo cáo](../reports/JOURNEY_FEEL_AND_AUTO.md), [plan](../plans/JOURNEY_FEEL_AND_AUTO.md).

- New game: bundle `0.2.0-campaign.2-journey`, slots `journey-*`; giữ O1 `argon-*`, có nút tải O1. Không migrate ngầm. Luật combat O1 giữ nguyên.
- Node24.14.0: **129 tests/8 files**, validators/TS/build pass; 48 Journey runs: 36 thắng/12 thua chủ đích, 0 softlock/rejected, 48 save/load/replay. Browser desktop/mobile đã thử video đang phát thật/skip/tự hết/404 fallback, auto thắng→OFF, manual stop và load→OFF, điều tra mở lựa chọn, text không tràn ngang.
- Source/media mới: `src/content/journey.ts`, `src/read-models/auto-combat.ts`, client hooks/TravelCinematic; `public/video/journey/`, `art/journey/clip-receipt.json`, `scripts/build-journey-clip.py`. Cinematic dựng motion từ art A2, không phải clip Flow/Veo; chỉ có một shot chung. Không gen lại A1/A2 hoặc tiêu Google credits.
- Chưa làm sâu mọi địa điểm; cần playtest độ hấp dẫn/nhịp clip và các slice tiếp. Chưa QA setting reduced-motion hệ điều hành/điện thoại thật. Mobile combat có scroll dọc ngắn; console desktop đã sửa grid 3 hàng.
- Git: implementation `da38847` đã commit/push `origin/main`, SHA remote đã đối chiếu; cập nhật bàn giao Git này ở commit docs tiếp. Tracked tree sạch trước cập nhật docs, chỉ còn `docs 2/` và ZIP đầu vào chưa tracked.
- Quyền tiếp tục: QA/code trong scope phản hồi được phép. Bước tiếp là đánh giá bản Journey mới, không quay lại O1 từ đầu. Khi dừng, giữ media/simulation/evidence trong repo và xác nhận Git thực tế; `docs 2/`/ZIP không stage.


**Checkpoint 2026-10-29 — Argon O0/O1 đã tích hợp, đang chờ duyệt hình/nhạc:** Người dùng đã yêu cầu “bắt đầu triển khai đi”; được sửa code/art và chạy QA cho phần thay đổi. Đã có combat mới + shell/scene/map/stage, atlas/nền mới, nhạc Gemini và sequencer. Bundle `0.2.0-campaign.1-argon`, legacy resolver giữ nguyên, slot mới tách riêng. [Báo cáo triển khai](../reports/ARGON_O1_IMPLEMENTATION.md).

- Gate thật Node24.14.0: full check 118 tests rồi bổ sung reflection/revive; cuối **120 tests pass**, strict TS/build pass. 96 Argon simulation runs: 72 thắng/24 thua chủ đích, 0 softlock/rejected, 96 save/load/replay. Không chạy lại batch lớn nếu không có thay đổi liên quan.
- Browser: 1280×720, 1920×1080, 390×844; skill/heal/swap/save-load/skip/thắng/bắt giữ/về scene, module/thoát nhiệm vụ, atlas fallback. Audio playback kỹ thuật đạt; chưa duyệt cảm nhận mix/loop hoặc hiệu năng thiết bị thật.
- Source chính `src/combat/tactical-*`, `src/content/argon.ts`, `src/client/argon/`, App/use-game/audio. Media/prompt/master/manifest nằm `art/argon-o1/`, bản web `public/`. Preset QA chỉ dev, command thật; server demo 5180 là origin riêng.
- **Chưa hoàn tất toàn bộ đại tu.** Crew/inventory/journal/ScenarioScene còn tái dùng component/CSS; O2 thay sâu, O3/O4 progression/content còn chưa làm. Không báo đã đủ mọi yêu cầu Argon.
- Git: implementation commit `22572a5` đã push `origin/main` và xác minh SHA remote. Bản cập nhật bàn giao này ở commit docs tiếp theo. Tracked tree sạch sau checkpoint; `docs 2/` và ZIP đầu vào giữ nguyên, không đưa vào commit tự động.
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

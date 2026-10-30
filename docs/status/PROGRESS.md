# LAST CONVOY — tiến độ hiện tại

**30/10/2026 — Lamplight đã triển khai, đang chốt Git.** Theo lệnh “ok thực hiện đi”, giữ chiến lược/combat và thêm một khu khám phá trực tiếp 3 phòng ở Thánh An; [plan](../plans/LAMPLIGHT_FIELD_EXPLORATION.md), [báo cáo](../reports/LAMPLIGHT_IMPLEMENTATION.md).

- **Bản mới:** `0.4.0-campaign.1-lamplight`, slots `lamplight-*`, state/save v3 additive, engine 0.1.0. Giữ tải Resonance/Journey/O1/R1/.4; legacy Scenario khớp byte bản gốc. Source: `src/fieldwork/`, `src/content/lamplight.ts`, ExplorationScreen/CSS, Scenario có version, tactical config, registry/processor/client.
- **Chức năng:** WASD/nút chạm, cửa/collision/LOS, đèn pin 24 đơn vị, bóng tiến theo tiếng động trong tối và bị cửa chặn. Khám phá theo nhịp hành động, đứng yên dừng simulation. Túi 2 món, 3 vật loot và hồ sơ mới, một lượt/site, thưởng một lần khi về xe. Dự trù 2 giờ cùng khẩu phần sống lúc vào, còn buffer 1 giờ; cứu hộ bỏ đồ/-4 HP/-8 xe, trần 96 nhịp. Scenario sửa scouts/roles/costs/double finish; combat/resource config riêng. Chưa có skill pathway trong fieldwork, realtime/procgen hoặc màn sau Bắc Sơn.
- **Gate Node 24.14.0:** full check **169/169 tests, 10 files**, validators/strict TS/build pass (Vitest 7.68s, Vite 5.84s). 23 test mới gồm exact ration buffer và Scenario combat không tính thêm giờ. 48 batch runs: 36 thắng/12 thua chủ đích, 0 softlock/reject, 48 save/load/replay; batch không chơi fieldwork, có test tuyến lấy 2 món/né bóng/save/replay riêng. Audit 72 đường old/new và 80 field actions; dispatch median 3.90ms, serialize full replay median 190.73ms/max 450.51ms. Field autosave debounce 650ms, flush khi exit/save/menu/load/hide; crash cưỡng bức trong khoảng chờ có thể mất bước cuối. Có warnings Zod annotation/chunk >500KB.
- **Browser QA riêng 5181:** desktop 1280×720/mobile 390×844; chọn Lan/đúng chi phí, WASD/nút chạm/cửa/pause, thuốc 8→11 khi về xe, cứu hộ thuốc8/Minh96/xe92, save/load giữ pin/vị trí, rule discovery và menu flush. Controls mobile hiện đủ, không tràn ngang; console cuối không warn/error. Artifacts `lamplight-*` có log/check/audit/simulation/ảnh. Không ghi save người dùng 5180, không chạy 2 script CDP bên review, không gen ảnh/Flow/tiêu Google credits.
- **Git:** baseline `f792071`; implementation/docs/artifacts hiện đang chốt commit/push. Giữ nguyên 4 đầu vào untracked (`docs 2/`, ZIP, 2 script review). Chưa có human playtest/điện thoại thật/reduced-motion OS/nghe duyệt mix. Không tuyên bố toàn game hoàn tất.
- **Bước tiếp:** new game 5180 hoặc thử nhanh origin QA5181 `?qa=explore`; chơi một lượt đánh giá điều khiển/quy tắc/áp lực pin trước quyết định nhân rộng. Được code/QA trong slice theo lệnh hiện tại; không tự mở scope sau Bắc Sơn hoặc gen lại media.

**30/10/2026 — review phản hồi Gemini/Claude và đề xuất khám phá2D:** Đã đọc hai attachment và đối chiếu source; [báo cáo](../reports/PLAYER_FEEDBACK_AND_2D_REVIEW.md). Xác nhận chỉ số khởi đầu/HP địch/kết thúc ở goal; bác kết luận2D tất yếu phá deterministic và việc copy Scenario đã tương đương điều khiển2D. Đề nghị audit kinh tế/Scenario rồi thử một khu3phòng với local clock/command/lưới ẩn/Pixi hiện có; đây là đề xuất, chưa triển khai. Ghi rủi ro tĩnh finish reward lặp/role/chi phí cứng và luật alert thực tế; chưa tái hiện runtime. Chỉ docs, không test/build/browser/script bên review/gen hoặc thay gameplay; không nhận số playthrough đầu vào làm gate của phiên này. Bước tiếp là chốt phạm vi cải tiến theo phản hồi người dùng.

**30/10/2026 — bàn giao review cho Claude:** Theo yêu cầu người dùng, đã tổng hợp [CLAUDE_REVIEW_BRIEF](../reports/CLAUDE_REVIEW_BRIEF.md) từ source/Git và các báo cáo. Chỉ bổ sung tài liệu, không đổi code, không chạy test/build/browser QA hoặc tạo media. Gate146tests/48runs là kết quả29/10, không phải kiểm chứng mới. Nhắc gửi riêng `docs 2/concepts/` vì đầu vào chưa tracked. Source baseline đối chiếu `72276d0`; bước tiếp là nhận findings/đề xuất review rồi xác định scope cải tiến.

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

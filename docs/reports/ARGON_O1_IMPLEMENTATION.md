# Argon O0/O1 — checkpoint triển khai đầu tiên

Git implementation: `22572a5`, đã push `origin/main` và xác minh remote. Đầu vào `docs 2/`/ZIP giữ nguyên ngoài commit.

Ngày: 2026-10-29. Baseline Git: `6955279` (R4.1). Bundle mới: `0.2.0-campaign.1-argon`; engine `0.1.0`, state/save v3 giữ nguyên. Người dùng đã yêu cầu “bắt đầu triển khai đi”, bao gồm kiểm chứng phần thay đổi. Đây là bản chơi được đầu tiên của đại tu; chưa phải hoàn tất toàn bộ yêu cầu Argon.

## Chức năng thật

- Hành trình mới mặc định dùng combat tactical mới. Mỗi phe 4 slot, 2 hàng; cận chiến phụ thuộc hàng, đổi vị trí/swap tiêu lượt, hàng sau tự trở thành tuyến đầu khi tuyến trước không còn active.
- 8 ability theo dữ liệu: phá giáp, lưỡi kính khai thác phá giáp, hồi phục/vực dậy/cầm máu, che chắn, đạn gây bleed, sửa xe, đèn pha và phản chiếu bằng kỳ vật có ownership thật. Cooldown đếm lượt actor; hỗ trợ xe tối đa một lần mỗi vòng. Địch có ý đồ đánh người hoặc xe và gây thiệt hại thật.
- Opening encounter thu 1 giờ; hành động/hậu chiến trong trận thu 0 giờ. Scenario-crisis mở combat thu riêng 1 giờ. Chi phí hoàn tất nhiệm vụ R4 vẫn giữ như trước; không gộp nó vào phí từng lượt chiến đấu.
- Thắng/thua/rút lui/đầu hàng/đàm phán theo điều kiện, loot/capture/finish và facts đều đi qua processCommand. Damage preview dùng cùng công thức resolver.
- Shell/menu/HUD mới; scene/event, map và combat mới thay các route dashboard cũ. Crew/inventory/journal cùng ScenarioScene vẫn tái dùng component và một phần CSS cũ trong shell mới; cần làm lại sâu ở O2.
- Sequencer đọc battle.beat, phát pose/impact/HP/SFX theo thứ tự. State/autosave chốt trước animation; skip/load/menu/reduced motion không đổi kết quả engine. Pixi được lazy-load cho mưa/vệt va chạm; DOM/CSS dựng nhân vật/HUD và giữ đường fallback.
- Atlas 5 nhân vật × 2 pose, nền chợ sạch HUD, nhạc combat Gemini đã tích hợp. SFX/wind/drone và nhạc khám phá vẫn tổng hợp Web Audio. Mix tổng/nhạc/SFX/ambience riêng, mute, pause khi ẩn tab. Không tạo voice/video.
- Resolver cũ chuyển nguyên văn sang legacy-engine.ts; `.4` và `.5-r1` giữ luật cũ. Slot Argon tách `argon-autosave`/`argon-manual`; không tự chuyển hành trình cũ sang luật mới.

## File chính

- `src/combat/{engine,legacy-engine,tactical-engine,tactical-schema}.ts`, `src/content/argon.ts`: routing, luật, schema và content.
- `src/core/{commands,events,processor,invariants}.ts`: command/event contract, tick và structural checks.
- `src/client/argon/`, `src/client/{App,use-game,audio}.tsx/ts`: shell, stage, sequencer, map/scene và audio.
- `tests/argon.test.ts`: 14 tests mới. CLI campaign/simulation nhận `--content argon`; default CLI cũ vẫn R1.
- `art/argon-o1/{manifest,prompts}.json`, masters/audio/references; web assets trong `public/art/argon/` và `public/audio/argon/`.
- `scripts/prepare-argon-audio.py`: tạo loop PCM 76 giây, crossfade 4 giây, normalize -20 LUFS; cần ffmpeg khi rebuild offline, runtime/build không cần ffmpeg.

## Kiểm chứng đã chạy

Runtime Node **24.14.0**. Phạm vi là diff O0/O1 trên baseline `6955279`, chưa phải release toàn bộ Argon.

| Lệnh/kiểm tra | Kết quả thật |
|---|---|
| Baseline `npm run check` trước sửa | 106 tests / 6 files; validators, strict TS, build pass |
| `npm run check` sau tactical/scenario integration | 118 tests / 7 files; world/content hai bundle/art A2/TS/build pass |
| `npm test -- tests/argon.test.ts` sau thêm reflection/revive tests | 14/14 pass, 1.86s |
| `npm test` cuối | **120/120**, 7 files, 11.97s |
| `npm run build` cuối sau sửa routing/menu/notice | Strict TS + Vite pass; Vite 8.41s (sau sửa legacy wait/mission visibility) |
| `npm run simulate:campaign -- --content argon --seeds 12 --output artifacts/argon-o1-simulation.json` | 96 runs/8 policies: 72 thắng, 24 thua chủ đích starvation/hazard; **0 softlock, 0 rejected command, 96 save/load, 96 replay**, không issue |
| So sánh legacy-engine với Git baseline | Nội dung trùng nguyên văn engine combat trước thay đổi |
| Kiểm manifest bằng Python/Pillow + ffmpeg decode | 6 master/web đúng bytes/SHA-256; atlas RGBA, 912263 pixel alpha=0; nhạc decode không lỗi, derivative ~76s |
| `git diff --check` | Pass trước checkpoint |

Một test integration đầu tiên thất bại vì setup chưa đạt điều kiện crisis; đã sửa setup đi lấy 2 kiện hàng và quay về bãi đỗ, giữ nguyên luật. Test mới kiểm tra entry +1 giờ, battle không tăng giờ, finish/module và save/replay. Không đổi assertion để bỏ qua lỗi.

Browser QA dùng IAB tại **127.0.0.1:5180** (origin QA riêng, không ghi save cá nhân 5173/4173). Preset `?qa=...` chỉ bật ở dev, dựng state bằng command thật; preset ban đầu không ghi storage.

- Combat desktop **1280×720**, **1920×1080** và mobile **390×844** đã xem ảnh. Mobile combat scrollWidth=390, scrollHeight=844; không tràn ngang/cắt CTA.
- Qua UI: đánh/skill, phản công, hồi máu Bảo 80→90 và thuốc 8→7, swap Bảo/Lan có tiêu lượt, skip, save/load giữa trận (thông báo xác minh replay), chơi thắng, bắt giữ hai địch và trở về scene. Đồng hồ chiến đấu giữ 05:00; xe có nhận thiệt hại.
- Qua UI: vào nhiệm vụ từ scene, evacuate, lắp module và trở về. Sửa stale briefing route, reset briefing khi menu/start/load; sửa notice che CTA trên mobile. Scene/map không còn nhắc lại text mở combat sau hậu chiến.
- Thử thật atlas bị mất: tạm di chuyển file web, reload; cả 5 actor về portrait fallback. Đã khôi phục atlas. Bằng chứng `artifacts/argon-o1-atlas-fallback.jpg`.
- Mở settings sau action: trạng thái **Đang phát nhạc combat**, có 4 slider. Console không error/warn ở lượt kiểm cuối. Chỉ xác minh kỹ thuật playback/decoding; chưa thay người dùng duyệt cảm nhận nhạc/mix/điểm nối loop.

Bằng chứng: [desktop](../../artifacts/argon-o1-desktop.jpg), [1080p](../../artifacts/argon-o1-desktop-1080.jpg), [mobile](../../artifacts/argon-o1-mobile.jpg), [map mobile](../../artifacts/argon-o1-map-mobile.jpg), [simulation](../../artifacts/argon-o1-simulation.json).

## Findings đã sửa khi review

| Ưu tiên / vị trí | Tình huống và hậu quả | Xác nhận |
|---|---|---|
| P1 — App.tsx, scenario routing | Biến briefing còn true sau lắp module/menu/load giữ người chơi ở màn nhiệm vụ | Route theo scenario chưa lắp; reset khi menu/start/load. UI lắp module đã trở về scene; new game về gara |
| P1 — tactical-engine.ts, hit | Phản chiếu lấy damage đã clamp theo HP defender nên kẻ còn 1 HP phản sai lượng sát thương | Tách damage gốc và clamp theo recipient; test phản đòn >1 HP, tiêu ward đúng một lần |
| P2 — argon.css, transition-note | Notice trên mobile đè CTA, click không thực hiện | Notice không bắt pointer ngoài nút đóng; ẩn trong scenario |
| P2 — SceneScreen.tsx | Text mở combat còn xuất hiện sau thắng; wait legacy bị khóa bởi preview chỉ dành R1 | Scene không có event dùng location description; legacy vẫn có nút chờ theo supplies thật; mission entry chỉ bundle có operations |

## Cách chạy và thử

Dùng Node 24 theo `.nvmrc`, chạy `npm run dev`. Chọn **BẮT ĐẦU HÀNH TRÌNH** để dùng bundle mới. QA nhanh trong dev: `/?qa=combat`, `/?qa=market`, `/?qa=scenario`, `/?qa=map`, `/?qa=gara`. Production không dựng preset từ query.

Trình duyệt demo hiện ở `http://127.0.0.1:5180/?qa=combat`. Autosave/manual ở origin đó dành cho lượt QA này; không suy ra slot của 5173 tự xuất hiện tại 5180.

## Giới hạn và bước tiếp

- **O1 code tích hợp/technical gates đạt; duyệt hình/nhạc và human playtest còn mở.** Chưa chứng minh 60 FPS trên điện thoại thật, WebGL-loss QA, reduced-motion hệ điều hành, double-click stress hoặc mix nghe qua nhiều thiết bị. Chưa browser-QA mọi legacy skill/ending; có fixtures regression và resolver giữ nguyên.
- Mới có 2 pose cho 5 actor; recoil/downed bằng transforms, chưa full frame animation. Những actor còn lại dùng fallback. Chân dung A2/phong cách mới cần đồng bộ thêm; không gọi atlas này là bộ art cuối.
- Chưa đủ 4 ngạch, 6 kỳ vật/resonance, ethos/corruption/veto, rule động/map ẩn và ending mở rộng. Chưa có custom bell shader, voice hoặc Flow clip. Đây là O3/O4 trong plan, không dựng UI giả để đánh dấu có.
- O2 cần thiết kế lại sâu quản lý/nhiệm vụ, gỡ CSS/component cũ sau khi đủ parity; rà các luật scenario R4 còn dùng implementation cũ, bao gồm phí module/finish và narrative quanh Hà.
- Bundle main ~594 kB (gzip177), Pixi chunk ~902 kB (gzip260), Vite còn cảnh báo >500k; zod có annotation warnings. Build pass nhưng tối ưu bundle/performance chưa hoàn tất.
- Bước đầu tiếp tục: lấy feedback trên trận O1, chốt chất lượng hình/mix, rồi thực hiện O2 theo concept 01/03 và component quản lý; không khởi động lại baseline hay generate lại A1/A2 hàng loạt.

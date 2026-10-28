# LAST CONVOY — tiến trình chung và điểm tiếp tục

**Cập nhật:** 2026-10-28, Asia/Ho_Chi_Minh.
**HIỆN TẠI — R1 ĐÃ TRIỂN KHAI, ĐANG CHỐT CHECKPOINT GIT:** hoàn tất đợt sửa theo phản hồi game nhàm chán. Kế hoạch trước code: [PLAYABILITY_PLAN.md](PLAYABILITY_PLAN.md). Báo cáo chi tiết: [PLAYABILITY_REPORT.md](PLAYABILITY_REPORT.md). Các phần Phase 0–5 bên dưới là lịch sử.

### Điểm tiếp tục mới nhất — R1 (2026-10-28)

- `src/expedition/`: scout cache/XP một lần, intel giảm risk tuyến có hạn; nghỉ hồi HP/energy, repair tiêu scrap; progression/points/upgrades/stances có hiệu lực combat. Config training/stance là command 0 tick.
- Encounter chợ: 2 đối thủ 46/40 HP, loot thật và 10 XP; không giải nhầm main rival. 12 event, boss màn 3 còn nguyên. Tro Tàn tiếp tục clock khi đánh encounter phụ. Đã chặn attack/skill target ngoài battle hiện tại.
- `src/read-models/` và UI: crew HP/energy/công/thủ/điểm ngay trên map; chọn nhân vật mở training/stance/skill tại chỗ. Command deck có tổng cost/benefit, action report có costs/gains/net/HP/energy/xe/XP/quests/ownership. Combat chọn target/skill rồi cast, damage preview cùng formula resolver. Cấp cứu ngoài trận và Linh cảm có scout sâu.
- `src/client/audio.ts`: Web Audio procedural ambient/cues, mute/volume lưu preference. Browser xác minh context running sau click, mute/unmute và volume 0/100/40; chưa human listening review.
- Bundle `.4` snapshot trong `src/content/archive/`; `.5-r1` mới dùng slot riêng. Genuine fixtures từ Git `8f987d7` (mid/completed/waited) load/replay nguyên snapshot. Tải manual trong legacy vẫn dùng slot legacy.
- **Gate cuối:** `npm exec --yes --package=node@24 -- npm run check`: **103 tests / 5 files pass**, validators/typecheck/build pass. Build có warning Zod annotation và JS ~534 KB (gzip ~157 KB). `git diff --check` pass, không thấy Math.random/Date.now/eval trong modules gameplay.
- Browser production seed42: scout/training/stance → chợ combat/capture → nghỉ/sửa/Cấp cứu → hospital Sense/records/patient → mirror bị NPC lấy trước → main combat/loot/capture/care → **ending.shared-dawn**, T40, 4 người/1 kỳ vật/xe100%, food3. Save → rest → load khôi phục đúng HUD/crew/tick. Console production và dev trực tiếp không có warning/error ghi nhận.
- Mobile harness390×844: scout/result, training/stance, chọn target và cast Phá giáp 33 HP hoạt động; screenshot trong `artifacts/r1-*`. Harness có log MutationObserver riêng, không tái hiện khi mở game dev/prod trực tiếp; không gán chắc nguồn lỗi cho game.
- Simulation R1 cuối300 seed: **2.400 runs / 1.800 thắng / 600 thua hợp lệ / 0 softlocks / 0 rejected**, **2.400 save/load+replay khớp**, issue list rỗng, max32 commands. `artifacts/r1-simulation.json` chứa batch cuối; không cộng batch100 trước vì trùng seed.
- NEXT: commit/push main thường và đối chiếu remote SHA. Preview4173 đã reload build mới, menu R1 sẵn. Sau bàn giao chờ human playtest/review; không tự mở scope asset/animation.
**Ủy quyền hiện tại:** người dùng yêu cầu triển khai đến hết Phase 5; lập plan chi tiết trước mỗi phase và giữ file tiến trình chung để tiếp tục khi hết token/context. Cho phép đồng bộ code lên repository đã chỉ định.
**Kế hoạch:** [PHASE_PLANS.md](PHASE_PLANS.md). **Repository:** https://github.com/phamhuyhoang95/Doomsday-Convoy, branch `main`, SSH origin.

**LỊCH SỬ CHECKPOINT PHASE 0–5.** Gate khi đó **86 tests / 4 files pass**, validators/typecheck/production build pass, clean install pass, audit 0 vulnerabilities. Campaign `.4` có **2.400 runs / 1.800 wins / 600 valid losses / 0 softlocks / 0 rejected commands**, mọi save/load+replay khớp. Đã chơi production tới 2 kết cục khác nhau. Chi tiết: [QA_REPORT.md](QA_REPORT.md). Checkpoint code **`ba483d0` đã push lên origin/main và đối chiếu remote SHA**.

## Trạng thái phase

| Phase | Trạng thái | Gate còn thiếu |
|---|---|---|
| 0 Foundation | Hoàn tất, đã kiểm tra | Không còn gate mở |
| 1 Headless | Hoàn tất, đã kiểm tra | Không còn gate mở |
| 2 Event/Quest | Hoàn tất, đã kiểm tra | 53 tests + content validator + build pass |
| 3 Combat/Skill/Artifact | Hoàn tất, đã kiểm tra | Combat/NPC/skills/artifacts/anomaly + 67 tests/build pass |
| 4 Playable UI | Hoàn tất vòng chơi browser | Full route/combat/capture/save-load đã kiểm tra; mobile/endings QA tiếp Phase 5 |
| 5 Content/QA | Hoàn tất | 86 tests/build/clean install + 2.400 campaign runs + production/mobile QA pass |

## Những gì đã có ở checkpoint Phase 1 (lịch sử)

- Checkpoint GitHub `d0936411c75b79c471fd050780fdc07993229576` đã push và đối chiếu remote; các thay đổi sau đó hiện chưa commit.
- npm project với TS strict, Zod, React/Vite, Vitest. Đã nâng Vitest 3.2.7 → 4.1.12; npm audit lúc cài sau nâng báo **0 vulnerabilities**.
- `src/content/world.ts`: 3 regions, 8 locations, 11 routes, 3 actors; 3 tuyến direct/detour/bypass.
- `src/core/`: primitives, Mulberry32, commands, events, state schema/init, resources, invariants, processor, replay và public exports.
- `src/world/`: Zod schemas, ID/reference/reachability/start-supplies validator, route planning/read model.
- `src/persistence/`: serialized versioned save, v0→v1 migration, exact content version và replay verification, localStorage adapter injected.
- `src/simulation/`: route scenario, seeded wander/exhaustion bot, batch statistics/replay verification.
- `scripts/`: headless CLI với mid-journey save/load và disk round trip; simulation JSON; world validator.
- `src/client/`: trang foundation React/Vite (chưa là UI chơi game), CSS và Vite types.
- `AGENTS.md`: architecture/coding/testing/Git conventions. Cần sửa dòng giới hạn Phase 1 để phản ánh ủy quyền mới.

## Lệnh đã chạy và bằng chứng

- `npm install` ban đầu: thành công; audit phát hiện dependency Vitest cũ.
- `npm install --save-dev --save-exact vitest@4.1.12`: npm 10 gặp lỗi `edgesOut` (không giả định thành công).
- Thử lại với `--legacy-peer-deps`: thành công, audit 0 vulnerabilities. Cảnh báo engine vì Node hệ thống `v23.11.0`, Vitest 4 yêu cầu Node 20/22/24; cần runtime Node 24 hoặc 22 cho gate chính thức.
- `npm run typecheck`: thành công sau khi thêm `src/client/vite-env.d.ts` (trước khi thêm scripts/simulation; cần chạy lại).
- `npm run typecheck && npm run demo -- --seed 42 --path direct --save artifacts/demo.save.json`: process được khởi động ở exec session `77616` trước khi người dùng đổi scope. **Phải đọc kết quả/poll session hoặc chạy lại**, không xem là đã pass cho tới khi xác nhận.
- Chưa chạy Vitest vì chưa viết test. Chưa chạy production build hoặc batch simulation.

## Các quyết định gameplay Phase 1

- Một tick = 60 phút. Mỗi thành viên sống tiêu hao 1 food và 1 water/tick; route thêm fuel cost.
- Travel atomic: trả đủ chi phí trước; roll hazard; arrive/cập nhật visits và knowledge; sau đó xác định terminal state. Xe bị phá hủy trên tuyến vẫn có recorded arrival nhưng kết cục thua (kể cả tuyến đến goal).
- Mỗi travel dùng ít nhất một RNG draw cho risk; hazard dùng thêm damage draw. Wait không dùng RNG.
- Refuge cho phép thắng khi vừa dùng hết ration; ngoài refuge không đủ một tick ration sẽ thua, resource luôn không âm.
- Invalid command trả state input nguyên vẹn, không thêm log hoặc events. Accepted log lưu authority/command/tick/RNG/domain events.
- Save hiện tại chứa toàn bộ command log; load replay so khớp snapshot. Kiểm tra integrity/debug, không phải chữ ký chống gian lận.
- Phase 1 fields activeEvents/activeQuests/NPC/artifact/combat đang **reserved empty**, cần triển khai thật trong Phase 2–3 và migration/version phù hợp.

## Báo cáo Phase 0–1

- Node 24.22.1 chạy qua `npm exec --yes --package=node@24 -- ...`, không thay Node toàn hệ thống; `.nvmrc`=24.
- `npm run check` qua Node 24: world validation **pass**, **43 tests pass**, TypeScript + Vite production build **pass**.
- Demo seed 42 direct: thắng `ending.arrival`, tick 11, 5 commands, 22 events, 6 RNG draws. Mid-save/load, full replay và disk round trip đều khớp.
- Simulation 1.000 seed × 5 policies = **5.000 runs**, **3.071 wins / 1.929 losses / 0 softlocks / 0 rejected commands**. Cả direct/detour/bypass thắng 1.000/1.000. Replay xác minh toàn bộ 5.000 runs. Báo cáo: `artifacts/phase1-simulation.json`.
- README/GAME_BIBLE/ARCHITECTURE/MVP_SCOPE/AGENTS/PHASE_PLANS đã có. UI hiện là trang foundation đúng phạm vi Phase 1.
- `npm install --package-lock-only` bằng Node 24: thành công, audit **0 vulnerabilities**. `npm ci` đã được khởi chạy để xác minh clean install, cần đọc kết quả session 55272 trước khi ghi pass.

## Quyết định trước Phase 2

- Thêm campaign content bundle có Zod schema vào world definition; giữ chế độ logistics để bảo toàn scenario/test Phase 1.
- Conditions/effects là discriminated unions theo operator allowlist. Event lựa chọn dùng requirements/costs/weighted outcomes, áp dụng trên clone trong transaction.
- Quest contract dùng facts/knowledge/ownership/location access/NPC status, không phụ thuộc event ID nối tiếp. Tạo ít event chứng minh trước, chỉ mở rộng đủ 12 ở Phase 5.
- Dùng version state/save mới khi thay reserved fields. Giữ migration Phase 1 logistics; content campaign version khác nhau sẽ báo mismatch rõ ràng thay vì load sai rules.
- API đọc eligibility/quest/debug phục vụ CLI và UI sau này, không đưa rules vào React.

## NEXT — tiếp tục tại đây

1. Phase 0–5 đã xong. Xác minh checkpoint Git cuối nếu cần bằng `git status` và `git log -1`; không triển khai lại hoặc tự mở Phase 6.
2. Chờ review/yêu cầu tiếp theo. Hạng mục đề xuất: human playtest để đo 30–60 phút và tune difficulty; thay placeholder bằng asset riêng nếu người dùng muốn.
3. Để chạy lại: Node 24, `npm ci`, `npm run check`, `npm run dev` hoặc `npm run build && npm run preview`. Xem README cho fallback Node 24 tạm nếu Node hệ thống là 23.

## Báo cáo Phase 4 và quyết định trước Phase 5

- Phase 3 gate cuối: **67 tests pass**, validators/build pass; commit `52b3d6a` đã push.
- UI React có main menu/seed/continue, 5-resource HUD, vehicle/crew, graph map route cost/risk, event requirements/costs, combat target/skill/defend/negotiate/surrender/retreat/capture, convoy/inventory/quest/knowledge/debug tabs, autosave/manual save/load, terminal summary.
- `npm run build` qua Node 24 pass, bundle ~408 KB trước gzip. Zod có comment annotation warnings vô hại từ dependency (không lỗi build).
- Browser localhost đã chơi thực: prepare → market → hospital listen → ward bind mirror → checkpoint fight → strike/attack, enemy attack giảm Lan 8 HP và xe 2 condition → capture Quạ/Tàn → finish → refuge. **Won tick 22**, 3 người sống, 1 kỳ vật, xe 83. Save ở hospital, wait rồi load đã khôi phục vật tư đúng, tiếp tục hành trình bình thường.
- Browser dev logs: không có error/warn ở lần kiểm tra đầu. UI đang chạy qua dev server exec session `11170`, localhost:5173; CUA tab `gameTab` ở browser iab.
- Phase 5 sẽ mở rộng 4→12 events, thêm Ha là survivor tùy chọn (vẫn 3 ban đầu), endings theo ownership/rescue/mercy, asset registry fallback đủ 9 kinds. Không thêm ảnh/âm thanh từ ngoài.
- Bot policies peaceful/combat/trade/surrender/fallback phải chạy bộ content cuối; thêm actual NPC death/mirror ownership/location closure tests, mid-combat saves và report multi-seed.

## Báo cáo Phase 3 và quyết định trước Phase 4

- Combat deterministic có turn order, attack/defend/skill/retreat/negotiate/surrender, enemy AI, downed/capture/aftermath/finish. Loot thay tài nguyên và owner kỳ vật thật; enemy attack làm hỏng xe.
- Actor energy/cooldown/health, 4 skill data operators. Anomaly interaction obey/violate gọi effect list được validate.
- Rival có convoy/2 actors/resources/vehicle/location, goal AI theo tick, có thể cướp physical mirror sau deadline rồi quay lại chặn đoàn. Death fact cập nhật từ actor states.
- State/save v3, migrate logistics v1/v2; campaign content `.2` (khác rules/content `.1`).
- `npm run check` qua Node 24 trước hai test cuối: **65 tests pass**, validators/build pass. Đã thêm mid-combat save/replay và retreat test; đọc kết quả session 25102 để xác nhận tổng 67.
- `npm run demo:campaign -- --seed 42 --policy combat`: **won**, tick 22, 16 commands, 3 contracts succeeded, mirror thuộc player, replay/save verified.
- UI sẽ dispatch Command API và đọc read models; không đặt kết quả event/combat trong React. Menu/seed/autosave/manual save, responsive map + side event panel, tabs crew/inventory/journal/debug, combat target/action screen và ending.
- Browser QA qua localhost sau production/typecheck gate; cuối Phase 5 xác minh cả peaceful và combat route, save/load và màn hình hẹp.

## Báo cáo Phase 2 và quyết định trước Phase 3

- Phase 0–1 commit `0380438` đã push. Clean install `npm ci` qua Node 24 pass, audit 0 vulnerabilities.
- Phase 2: `src/narrative/` có schema allowlist, evaluator, transactional effects, event director/weighted outcomes/hooks, quest generator/contracts và reference/fallback/cycle validator.
- `src/content/campaign.ts` có 4 event chứng minh, 3 contracts và 2 artifact definitions/instances. Đây chưa phải bộ 12 event hoàn chỉnh.
- Command choose/investigate, generic travel requirements, objective facts tách knowledge, ownership single instance. Save/state lên v2; migration logistics v1 và development v0 được giữ.
- `npm run check` qua Node 24: **53 tests pass**, world/campaign validator pass, build pass. `CONTENT_GUIDE.md` hướng dẫn content và giới hạn validator tĩnh.
- Phase 3 quyết định: combat theo turn order, một player action rồi enemy AI tới lượt player kế; aftermath cho capture/finish. Commands đều qua transaction, mỗi action tiến 1 tick.
- Rival có convoy/actors/resources/location/goal riêng, hành động theo world tick, có thể lấy mirror sau deadline. Negotiation/retreat/surrender là resolution thật; loot/ownership cập nhật nguyên tử.
- Bốn skill là data operators damage/heal/guard/reveal; cooldown/energy/costs trên actor. Không switch theo ID kỹ năng.
- Tăng state/save version cho combat; các content campaign cũ báo mismatch nếu rules đổi, giữ migration cho logistics Phase 1.

## Lỗi/giới hạn cần theo dõi

- Phase 0–5 đã qua các kiểm tra được liệt kê trong báo cáo; không có blocker triển khai đang mở.
- Node hệ thống 23 không nằm trong engines của Vitest 4; các gate đã dùng Node 24.22.1 qua npm exec. Tiếp tục dùng Node 24 hoặc Node 22.12+.
- Assets vẫn là placeholders; chưa có audio asset, cloud save hay online services. Cài đặt sạch được kiểm tra trong thư mục QA tạm riêng.
- Thời lượng mục tiêu 30–60 phút cần human playtest, không thể xác nhận chỉ từ bot.

## Nhật ký triển khai Phase 5 (lịch sử, đã đóng)

- Đã tách content thành events/texts/facts/quests/endings/assets/skills/rival và bundle campaign `.3`. Có **12 events**, **4 contracts**, **6 ending contracts**, 3 initial crew + Hà cứu tùy chọn, 4 skills/2 artifacts/1 rule anomaly/1 rival.
- Thêm nhánh niêm phong bệnh viện + Đèn không tắt, mirror đổi chủ trước khi player tới, rescue ảnh hưởng thoại/parley và ending, prisoner aftercare/mercy, weighted cache trap.
- State/save vẫn v3 (thay đổi content/rules được version bằng campaign `.3`); save/logistics cũ tiếp tục migration. Các save campaign `.2` báo content mismatch có chủ ý.
- Asset registry đủ 9 kinds, tất cả dùng URI-free fallbacks. Client xử lý missing/broken URI, không có audio asset nên không phát âm thanh.
- 67 tests cũ đã pass với bộ 12 events sau khi cập nhật test flow cho các event mới. Build phát hiện `exactOptionalPropertyTypes` ở AssetArt ID; đã sửa kiểu, gate đang chạy lại (session 33787).
- Đã thêm campaign batch runner với 7 policies (5 tuyến thắng + starvation + guaranteed lethal hazard), kiểm tra save/load + replay từng run; chưa chạy báo cáo lớn.
- NEXT tại thời điểm ghi log (hiện đã hoàn tất): tests actual NPC death/stolen mirror/location fallback/endings/content extension/assets → batch 300 seeds → browser final peaceful/combat/mobile/save-load → docs/report/check/commit/push.

### QA phát hiện và sửa thêm

- Gate bộ content `.3`: 82 tests/build pass. Batch 300 seeds × 8 policies = 2.400 runs, 1.800 wins / 600 valid losses / 0 softlocks / 0 rejected, save/load+replay toàn bộ pass.
- Browser bộ 12 events: peaceful kết cục shared-dawn (4 người, giữ mirror) và trade borrowed-dawn (4 người, mất mirror), cùng seed 42, tick 20. Save/wait/load giữa hospital khôi phục resources đúng; console không error. Mobile iframe 390px đã load manual save và hiển thị HUD/map/routes tốt.
- Rà soát nhánh thủ công phát hiện: bỏ qua event departure rồi niêm phong hospital có thể giữ dependency departure chưa giải. Đã sửa contract departure alternate theo việc thực sự rời garage, không cần event ID; thêm regression scenario đi vòng đầy đủ.
- Đã thêm cleanup fail các quest đang active khi run thua, không thực thi gameplay effects sau terminal defeat. Thêm regression save/replay khi starvation.
- Campaign content tăng `.4` để không âm thầm thay rules của save `.3`. Cần chạy lại gate và report simulation cuối cho version `.4`.

## Báo cáo hoàn tất Phase 5

- Đã chạy lại gate cho content `.4`: world/campaign validators pass; **86 tests pass**; TypeScript strict + production build pass. Hai test cuối xác nhận endings keepers/last-light, nên cả 6 ending contracts đều có tuyến kiểm tra.
- Clean install trong `/tmp/last-convoy-clean.4tdbE7`: `npm ci` pass, **0 vulnerabilities**, full check/build pass; không tác động node_modules hoặc server ở workspace.
- Report cuối `artifacts/phase5-simulation.json` đúng content `.4`: 300 seeds × 8 policies = **2.400 runs**, **1.800 wins / 600 valid losses / 0 softlocks / 0 rejected**; **2.400 save/load checks + 2.400 verified replays**, issue list rỗng.
- Production preview port 4173: chơi bộ 12 events seed 42 tới **shared-dawn** (cứu Hà + giữ mirror) và **borrowed-dawn** (giao mirror), đều 4 người và tick 20. Manual save/wait/load pass; console error list rỗng.
- Đã quan sát mobile viewport 390 × 844 bằng iframe harness: menu, HUD, map/route controls và tải manual save. Không thấy tràn ngang ở các view này; không coi là test mọi thiết bị.
- Ảnh QA nằm trong `artifacts/`: phase4-ending, phase5-peaceful-ending, phase5-trade-ending, phase5-production-ending, phase5-production-trade, phase5-mobile, phase5-gameplay.
- README, GAME_BIBLE, ARCHITECTURE, MVP_SCOPE, CONTENT_GUIDE, QA_REPORT, PHASE_PLANS và file này đã cập nhật. Source format thống nhất bằng Prettier 3.6.2, không thêm project dependency.
- Giới hạn còn lại: thời lượng 30–60 phút/độ khó chưa human playtest; placeholders chưa là art hoàn chỉnh; không có audio asset; save localStorage cùng-origin, toàn log; không multiplayer/server/AI runtime. Không phát hiện lỗi nghiêm trọng trong các kiểm tra đã hoàn tất.
- Checkpoints: `d093641` initial backup → `0380438` Phase 0–1 → `19df90a` Phase 2 → `52b3d6a` Phase 3 → `e7d34b6` Phase 4 → **`ba483d0` Phase 5**, tất cả đã push lên GitHub. Một commit docs tiếp theo chỉ chốt trạng thái checkpoint này; xem `git log -1` để biết HEAD mới nhất.

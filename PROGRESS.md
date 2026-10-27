# LAST CONVOY — tiến trình chung và điểm tiếp tục

**Cập nhật:** 2026-10-27, Asia/Ho_Chi_Minh.
**Ủy quyền hiện tại:** người dùng yêu cầu triển khai đến hết Phase 5; lập plan chi tiết trước mỗi phase và giữ file tiến trình chung để tiếp tục khi hết token/context. Cho phép đồng bộ code lên repository đã chỉ định.
**Kế hoạch:** [PHASE_PLANS.md](PHASE_PLANS.md). **Repository:** https://github.com/phamhuyhoang95/Doomsday-Convoy, branch `main`, SSH origin.

## Trạng thái phase

| Phase | Trạng thái | Gate còn thiếu |
|---|---|---|
| 0 Foundation | Hoàn tất, đã kiểm tra | Không còn gate mở |
| 1 Headless | Hoàn tất, đã kiểm tra | Không còn gate mở |
| 2 Event/Quest | Hoàn tất, đã kiểm tra | 53 tests + content validator + build pass |
| 3 Combat/Skill/Artifact | Hoàn tất, đã kiểm tra | Combat/NPC/skills/artifacts/anomaly + 67 tests/build pass |
| 4 Playable UI | Hoàn tất vòng chơi browser | Full route/combat/capture/save-load đã kiểm tra; mobile/endings QA tiếp Phase 5 |
| 5 Content/QA | Đã có plan, chưa triển khai | 12 events/assets/campaign simulation/full QA |

## Những gì thực sự đã có

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

1. Triển khai Phase 5 theo plan: đủ 12 events → ending contracts → asset registry/fallback → campaign multi-seed simulation → bổ sung tests fallback/death/ownership → full gate/browser QA.
2. Hoàn thiện README/architecture/content guide/QA report, commit/push và báo cáo thực tế (không xác nhận thời lượng 30–60 phút nếu chưa human playtest).

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

- Phase 0–1 đã pass; chưa kiểm tra gameplay Phase 2–5.
- Node hệ thống 23 không nằm trong engines của Vitest 4; cần xử lý cho các lần verification tiếp theo.
- Chưa có gameplay event/quest/combat/skill/artifact/NPC trong runtime. Không đánh đồng mô phỏng di chuyển với chiến dịch 3 màn hoàn chỉnh.
- Thời lượng mục tiêu 30–60 phút cần human playtest, không thể xác nhận chỉ từ bot.

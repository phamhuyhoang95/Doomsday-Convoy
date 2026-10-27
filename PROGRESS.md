# LAST CONVOY — tiến trình chung và điểm tiếp tục

**Cập nhật:** 2026-10-27, Asia/Ho_Chi_Minh.
**Ủy quyền hiện tại:** người dùng yêu cầu triển khai đến hết Phase 5; lập plan chi tiết trước mỗi phase và giữ file tiến trình chung để tiếp tục khi hết token/context. Cho phép đồng bộ code lên repository đã chỉ định.
**Kế hoạch:** [PHASE_PLANS.md](PHASE_PLANS.md). **Repository:** https://github.com/phamhuyhoang95/Doomsday-Convoy, branch `main`, SSH origin.

## Trạng thái phase

| Phase | Trạng thái | Gate còn thiếu |
|---|---|---|
| 0 Foundation | Hoàn tất, đã kiểm tra | Không còn gate mở |
| 1 Headless | Hoàn tất, đã kiểm tra | Không còn gate mở |
| 2 Event/Quest | Đã có plan, chưa code | Schema/operator/director/contracts/validation/tests |
| 3 Combat/Skill/Artifact | Đã có plan, chưa code | Combat/NPC/ownership/anomaly/tests |
| 4 Playable UI | Đã có plan, chưa code gameplay | Menu/map/event/combat/journal/storage/QA |
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

1. Xác nhận npm ci session 55272, commit/push Phase 0–1 và kế hoạch/tiến trình.
2. Triển khai Phase 2 theo plan và quyết định ngay trên: schemas/content registry → evaluator/effects/director/contracts → commands → save migration → tests/content guide/validator.
3. Sau gate Phase 2, ghi kết quả ở đây rồi đọc plan Phase 3 trước khi code combat/NPC.

## Lỗi/giới hạn cần theo dõi

- Phase 0–1 đã pass; chưa kiểm tra gameplay Phase 2–5.
- Node hệ thống 23 không nằm trong engines của Vitest 4; cần xử lý cho các lần verification tiếp theo.
- Chưa có gameplay event/quest/combat/skill/artifact/NPC trong runtime. Không đánh đồng mô phỏng di chuyển với chiến dịch 3 màn hoàn chỉnh.
- Thời lượng mục tiêu 30–60 phút cần human playtest, không thể xác nhận chỉ từ bot.

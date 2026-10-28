# LAST CONVOY v0.1 — báo cáo QA

**Cập nhật R1:** xem [PLAYABILITY_REPORT.md](PLAYABILITY_REPORT.md) cho content `.5-r1`, 103 tests và browser QA mới. Báo cáo bên dưới là checkpoint Phase 5 trước phản hồi trải nghiệm.

Ngày **2026-10-28**, Asia/Ho_Chi_Minh. Runtime **Node 24.22.1**, TypeScript strict, Vitest **4.1.12**, Vite **7.3.7**. State/save **v3**, engine **0.1.0**, campaign **0.1.0-campaign.4**.

## Gate và môi trường

- `npm run check`: **86 tests / 4 files pass**, world/campaign validators pass, typecheck và production build pass.
- Cài đặt sạch trong `/tmp/last-convoy-clean.4tdbE7`: `npm ci` thành công, **0 vulnerabilities**, toàn bộ check/build thành công. Thư mục QA tách khỏi workspace và dev server đang chạy.
- Source format bằng Prettier 3.6.2, dùng như tool tạm, không thêm runtime dependency.
- Build có warning comment `@__PURE__` từ Zod bị Rollup bỏ qua; không có lỗi TypeScript hoặc build.

## Đủ 14 nhóm kiểm thử bắt buộc

| # | Hành vi | Test / bằng chứng |
|---|---|---|
| 1 | Determinism | fixed Mulberry32 vector, cùng seed/state/commands; replay mọi batch run |
| 2 | Invalid commands | shape/type, authority, duplicate ID, stale event, wrong turn/target, ended game, frozen state giữ nguyên |
| 3 | Resource không âm | atomic insufficient fuel/supplies/event costs, starvation, lethal hazard |
| 4 | Routes/costs | directionality, adjacency, access flags, exact fuel/supplies/tick và preview |
| 5 | Conditions | fact khác knowledge, all/any/not, resources/location/ownership |
| 6 | Choices | data transactions, weighted cache outcomes, rule consequences, requirements và stale instance |
| 7 | Quest progression/alternate | rescue, hospital closed + lantern, bỏ departure, dependencies, cleanup khi thua |
| 8 | Ownership | player lấy mirror, trade cho rival, NPC lấy trước, loot sau combat, sole instance |
| 9 | Combat | attack/defend/skill, enemy AI, HP/vehicle, heal/energy/cooldown, retreat/negotiate/surrender/capture |
| 10 | Save/load | round trip/resume, mid-combat, storage/quota/missing slot, migration, forged/future/malformed save |
| 11 | Content refs | IDs/refs/hooks/operators/weights/costs, dependency/asset/anomaly cycles, required fallbacks |
| 12 | Replay | RNG/domain-event chain và snapshot equality; từ chối forged snapshot/history |
| 13 | NPC chết/kỳ vật đổi chủ | actual NPC deaths sau transfer, NPC lấy mirror trước; story vẫn giải được |
| 14 | Tuyến ba màn | peaceful/combat/trade/surrender/ruthless, quarantine bypass, browser end to end |

Tests: `tests/foundation.test.ts`, `tests/narrative.test.ts`, `tests/combat.test.ts`, `tests/campaign-qa.test.ts`. Core chạy trong Vitest Node, không có DOM. Các scenario riêng xác nhận cả 6 ending contracts đều reachable, không chỉ số lượng definitions.

## Simulation đã chạy

**Phase 1:** `npm run simulate -- --seeds 1000 --output artifacts/phase1-simulation.json`.

- Seed 0–999 × 5 policies = **5.000 runs**.
- **3.071 thắng / 1.929 thua / 0 softlock / 0 rejected command**.
- Direct/detour/bypass mỗi loại thắng 1.000/1.000. Replay toàn bộ khớp.

**Phase 5, content `.4`:** `npm run simulate:campaign -- --seeds 300 --output artifacts/phase5-simulation.json`.

- Seed 0–299 × 8 policies = **2.400 runs**.
- **1.800 thắng / 600 thua hợp lệ / 0 softlock / 0 rejected command**.
- Peaceful/combat/trade/surrender/fallback/ruthless mỗi loại thắng 300/300; starvation và lethal-hazard mỗi loại thua hợp lệ 300/300.
- **2.400 save/load checks và 2.400 replay-verified runs**, issue list rỗng; tối đa 22 commands/run trong các policy này.
- 600 lần thua là trường hợp thất bại được thiết kế để kiểm thử. Không tính chúng là lỗi. Không gộp các lần chạy lại cùng seed thành mẫu mới.

## Browser QA thực tế

- Phase 4: chơi gara → hospital → ward → checkpoint fight → strike/attack, enemy đánh Lan và xe → capture Quạ/Tàn → finish → refuge. Won tick 22, có ảnh `artifacts/phase4-ending.png`.
- Bộ 12 events: seed 42 cứu Hà, mở cache, học quy tắc, đọc hồ sơ, giúp người bệnh, lấy mirror, thuyết phục rival: **shared-dawn**, 4 người sống, 1 kỳ vật, tick 20.
- Chơi lại cùng seed, trade mirror thay vì giữ: **borrowed-dawn**, 4 người sống, 0 kỳ vật. Kết cục đổi từ ownership thật.
- Save thủ công ở hospital → wait làm giảm vật tư → load khôi phục HUD chính xác → chơi tiếp tới ending.
- Bản **production build** tại port 4173, content `.4`, đã chơi end to end đến shared-dawn và borrowed-dawn; save/load giữa hành trình pass, console error list rỗng.
- Mobile harness có viewport game thật **390 × 844**: menu/HUD/map/routes và manual load đã quan sát, không thấy tràn ngang trong các view đã kiểm tra. Không suy rộng thành hỗ trợ mọi thiết bị/browser.
- Ảnh: `phase5-peaceful-ending.png`, `phase5-trade-ending.png`, `phase5-production-ending.png`, `phase5-mobile.png` trong `artifacts/`.

## Các lỗi đã tìm và sửa

1. Bỏ event departure rồi niêm phong hospital có thể giữ dependency chưa giải: departure alternate hiện theo việc thực sự rời gara, không theo event ID. Regression đi hết đường vòng pass.
2. Quest còn active sau run thua: terminal defeat đóng quest chưa giải; không chạy gameplay effects mới sau game over.
3. Mirror bị rival lấy trước: ward có nhánh truy dấu/niêm phong, rival/ending không giả định player luôn sở hữu mirror.
4. Choice combat hiển thị khi rival không ở cùng nơi: read model vô hiệu hóa và giải thích chờ đối thủ.
5. Asset ID optional type: đã sửa và chạy lại strict typecheck/build.

## Giới hạn

- **Chưa human playtest để xác nhận mục tiêu 30–60 phút hoặc cân bằng độ khó.** Không suy thời lượng người chơi từ tốc độ bot.
- Seed/policy hữu hạn; không chứng minh mọi chuỗi command thắng được. Lãng phí vật tư có thể thua hợp lệ.
- Hình là CSS/SVG/typographic placeholders; không có audio asset nên chưa phát âm thanh.
- Save localStorage cùng-origin, toàn command log; chưa cloud sync, chữ ký chống gian lận hoặc tối ưu log lớn.
- Không có online multiplayer, persistent server, marketplace hay AI runtime. Server tương lai cần authentication/transport/command ordering.
- Không phát hiện lỗi nghiêm trọng trong các kiểm tra đã hoàn tất; những phần chưa kiểm chứng ở trên vẫn là giới hạn MVP.

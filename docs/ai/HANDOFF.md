# Bàn giao hiện tại

**Cập nhật 2026-10-29:** Đã hoàn thành triển khai và kiểm chứng R4.1 — Slice nhiệm vụ hiện trường "Chợ mất điện" (Market Blackout) và Module xe theo yêu cầu `@docs/plans/R4_GAMEPLAY_REDESIGN.md`.

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

## Bước tiếp theo (Backlog R4)
- Khi người dùng sẵn sàng, tiếp tục phát triển R4.2 (Sân đấu chiến đấu có vị trí, AP và mục tiêu phong phú hơn) hoặc mở rộng các nhiệm vụ hiện trường tiếp theo (Bệnh viện, Trạm dịch vụ).

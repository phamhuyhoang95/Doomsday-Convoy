# LAST CONVOY — tiến độ hiện tại

**2026-10-29:** Triển khai hoàn tất R4.1 — Slice nhiệm vụ hiện trường "Chợ mất điện" (Market Blackout) theo kế hoạch [R4_GAMEPLAY_REDESIGN](../plans/R4_GAMEPLAY_REDESIGN.md).

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

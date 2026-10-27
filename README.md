# LAST CONVOY — MVP v0.1

Game chiến thuật đoàn xe sinh tồn với core TypeScript headless và client React/Vite. Đã triển khai Phase 0–5: một chiến dịch ba màn có di chuyển, event, điều tra, kỹ năng, kỳ vật, NPC đối thủ, chiến đấu theo lượt, bắt giữ, nhiều kết cục và save/load.

## Chơi trên trình duyệt

Dùng Node.js 24 (xem `.nvmrc`), hoặc Node 22.12+.

```sh
npm ci
npm run dev
```

Mở http://127.0.0.1:5173, chọn seed rồi bắt đầu. Trên máy đang dùng Node 23, có thể chạy runtime tạm thời mà không thay Node toàn hệ thống:

```sh
npm exec --yes --package=node@24 -- npm run dev
```

Chọn event ở cột tình huống, chọn tuyến trong bản đồ, xem kỹ chi phí gồm khẩu phần. Tab Đoàn xe có health/energy/kỹ năng; Kho đồ cho biết kỳ vật hiện thuộc đoàn. Nhiệm vụ & manh mối chỉ hiển thị thông tin đã khám phá. Trong combat, chọn mục tiêu rồi attack/defend/skill, hoặc đàm phán/rút lui/đầu hàng. Đối thủ downed có thể bị bắt; người downed bị bỏ lại khi kết thúc trận sẽ chết.

Autosave ghi sau mỗi command hợp lệ. Lưu game/Tải game dùng slot thủ công riêng trong localStorage của browser/origin này. Đổi trình duyệt hoặc port sẽ không chia sẻ save. Save campaign có version nội dung khác sẽ báo không tương thích; save logistics Phase 1 có migration.

## Kiểm tra và chạy headless

```sh
npm run check
npm run demo -- --seed 42 --path direct --save artifacts/demo.save.json
npm run demo:campaign -- --seed 42 --policy peaceful
npm run demo:campaign -- --seed 42 --policy combat
npm run simulate -- --seeds 1000 --output artifacts/phase1-simulation.json
npm run simulate:campaign -- --seeds 300 --output artifacts/phase5-simulation.json
npm run build
npm run preview
```

`check` chạy world/content validators, Vitest, TypeScript strict và production build. Policies campaign: peaceful/combat/trade/surrender/fallback/ruthless. Batch thêm starvation và guaranteed lethal hazard để kiểm thử thất bại hợp lệ. CLI trả exit khác 0 nếu có softlock/rejected command. Simulation lớn có thể mất vài phút vì xác minh replay/save của từng lượt.

`preview` phục vụ build production tại http://127.0.0.1:4173. Save ở port 5173 và 4173 tách biệt theo origin của trình duyệt.

## Nội dung và kiến trúc

- 8 địa điểm, 11 tuyến, 12 event, 4 Story Contract, 6 kết cục đến nơi trú cùng các trạng thái thất bại.
- 3 nhân vật ban đầu; có thể cứu Hà lên xe. 1 đoàn đối thủ có mục tiêu riêng và có thể lấy gương trước bạn.
- 4 skill data driven, 2 artifact instances có owner duy nhất, 1 anomaly có quy tắc, 5 tài nguyên.
- `src/core/`: state/commands/RNG/invariants/events/replay, độc lập React/storage/network.
- `src/world/`, `src/narrative/`, `src/combat/`: bản đồ/NPC, conditions/effects/director/contracts, combat/skills/loot.
- `src/content/`, `src/assets/`: content registry bằng Zod, asset IDs và fallbacks.
- `src/client/`: render state, read models và dispatch commands; không tự resolve kết quả gameplay.
- `src/persistence/`, `src/simulation/`, `scripts/`, `tests/`: save migration, bots, CLI và verification.

Không cần hình hoặc âm thanh để chạy engine. Client dùng CSS/SVG/typographic placeholders và xử lý asset thiếu/lỗi. Chưa có audio asset nên không phát âm thanh. Debug tab hiện trong dev; production có thể bật bằng `?debug=1`. Dev mobile harness: http://127.0.0.1:5173/qa/mobile.html.

## Tài liệu và bằng chứng

- [PROGRESS.md](PROGRESS.md): tiến trình chung, checkpoints, kết quả thực và điểm tiếp tục khi hết context.
- [PHASE_PLANS.md](PHASE_PLANS.md): plan chi tiết trước từng phase.
- [QA_REPORT.md](QA_REPORT.md): 14 nhóm test, simulation, browser QA và giới hạn.
- [ARCHITECTURE.md](ARCHITECTURE.md), [CONTENT_GUIDE.md](CONTENT_GUIDE.md), [GAME_BIBLE.md](GAME_BIBLE.md), [MVP_SCOPE.md](MVP_SCOPE.md).

MVP không có online multiplayer, persistent server, marketplace hoặc AI runtime. Mục tiêu chiến dịch 30–60 phút cần human playtest và cân bằng thêm; chưa xác nhận thời lượng này bằng bot. Các báo cáo seed chứng minh những tuyến đã kiểm thử, không bảo đảm mọi chuỗi hành động có thể hoàn thành.

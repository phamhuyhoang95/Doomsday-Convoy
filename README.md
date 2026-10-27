# LAST CONVOY

Game chiến thuật đoàn xe sinh tồn, phát triển bằng TypeScript.

## Tiến trình

Phase 0–1 đã có lõi headless, command processor, graph map, seeded RNG, save/load, replay và automated tests. Các phase tiếp theo đang được triển khai theo [PHASE_PLANS.md](PHASE_PLANS.md); xem [PROGRESS.md](PROGRESS.md) để biết kết quả kiểm tra và điểm tiếp tục. Chưa coi đây là MVP ba màn hoàn chỉnh.

Hiện có 8 địa điểm, 11 tuyến và 3 nhân vật. Hành trình direct/detour/bypass tiêu tài nguyên và thời gian thật; rủi ro làm hư xe; hành trình thắng hoặc thua hợp lệ. React/Vite hiện chỉ có trang nền tảng, gameplay UI đến ở Phase 4.

Engine độc lập React. Mọi thay đổi qua `processCommand`; command bị từ chối không làm đổi state/RNG/log. Save chứa snapshot và command log; load xác minh lại bằng replay.

## Cài dependency

Khuyến nghị Node.js 24 (`.nvmrc`); cũng hỗ trợ Node 22.12+. Node 23 không được Vitest 4 hỗ trợ.

```sh
npm ci
npm run check
npm run demo -- --seed 42 --path direct --save artifacts/demo.save.json
npm run demo -- --seed 42 --path detour
npm run simulate -- --seeds 1000 --output artifacts/phase1-simulation.json
npm run dev
```

## Cấu trúc hiện tại

- `src/core/`: kiểu dữ liệu, khởi tạo game, RNG, command và resource helpers.
- `src/world/`: schema, kiểm tra tham chiếu và tính tuyến di chuyển.
- `src/content/`: dữ liệu bản đồ và các tuyến mô phỏng dự kiến.
- `src/persistence/`: save version/migration và localStorage adapter.
- `src/simulation/`, `scripts/`: scenario, bot và CLI.
- `tests/`: kiểm thử hành vi engine.

`npm run dev` mở trang nền tảng ở http://127.0.0.1:5173. `demo` xác minh save/load giữa hành trình, full replay và file round trip; `simulate` xuất thắng/thua/softlock và exit khác 0 nếu có softlock hoặc command bot bị từ chối. Các save cá nhân và node_modules được Git bỏ qua.

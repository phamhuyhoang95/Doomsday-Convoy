# LAST CONVOY

Game chiến thuật đoàn xe sinh tồn, phát triển bằng TypeScript.

## Trạng thái checkpoint

Đây là bản sao lưu giữa quá trình triển khai **Phase 0 và Phase 1**, chưa phải bản MVP chạy hoàn chỉnh.

Đã có cấu hình TypeScript strict, Vite, Vitest, Zod; schema command/state/domain event; RNG có seed; dữ liệu bản đồ 8 địa điểm và 11 tuyến; tạo trạng thái ban đầu; tính chi phí di chuyển và validate tham chiếu bản đồ.

Chưa hoàn tất command processor, save/load, replay, CLI mô phỏng, automated tests và entry point React. Các script tương ứng trong `package.json` là giao diện dự kiến, chưa phải toàn bộ đều chạy được. Chưa xác nhận build hoặc test thành công.

## Cài dependency

Yêu cầu Node.js >= 22.12 và npm.

```sh
npm ci
```

## Cấu trúc hiện tại

- `src/core/`: kiểu dữ liệu, khởi tạo game, RNG, command và resource helpers.
- `src/world/`: schema, kiểm tra tham chiếu và tính tuyến di chuyển.
- `src/content/`: dữ liệu bản đồ và các tuyến mô phỏng dự kiến.

Mục tiêu kế tiếp là hoàn thiện và kiểm thử lõi headless của Phase 1 trước khi chuyển sang Event/Quest hoặc gameplay UI.

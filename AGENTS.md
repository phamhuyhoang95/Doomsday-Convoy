# LAST CONVOY — quy ước cho coding agent

MVP Phase 0–5 và đợt cải thiện R1 đã hoàn tất; đọc trạng thái mới nhất trong `PROGRESS.md` trước khi làm việc. Không triển khai lại hoặc tự mở rộng scope khi người dùng chưa yêu cầu. R1 plan/report nằm trong `PLAYABILITY_PLAN.md` và `PLAYABILITY_REPORT.md`.

## Phạm vi và kiến trúc

- Đọc README.md, ARCHITECTURE.md và MVP_SCOPE.md trước khi mở rộng tính năng.
- Người dùng đã mở rộng phạm vi đến hết Phase 5. Đọc `PHASE_PLANS.md` trước mỗi phase và cập nhật `PROGRESS.md` sau mỗi phần lớn để tiếp tục được sau context reset. Báo cáo gate từng phase rồi tiếp tục trong phạm vi đã được ủy quyền.
- TypeScript strict. Giữ `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` và các kiểm tra unused.
- `src/core/` là nguồn sự thật: mọi thay đổi gameplay đi qua `processCommand`.
- Core/world không import React, DOM, filesystem, storage, network hay client. Không đọc clock hệ thống.
- Không dùng `Math.random`, `Date.now`, UUID ngẫu nhiên hay `eval` trong engine. Mọi RNG dùng `src/core/rng.ts`.
- Dùng ID ổn định cho content. Không nhúng asset path hay logic từng màn vào core.
- Content là dữ liệu; thay đổi schema/rules phải xem xét tương thích save/replay và tăng version phù hợp.
- Command bị từ chối không thay đổi state, tick, RNG, log hay domain events.
- Authority là tham số do adapter tin cậy truyền vào; không lấy quyền từ body command ở server tương lai.
- Không thêm server multiplayer, content AI runtime, Event/Quest/Combat giả hoặc UI mô phỏng lựa chọn văn bản.

## Bảo toàn code/content

- Kiểm tra Git diff và hiện trạng trước khi sửa. Không reset, xóa hoặc ghi đè công việc chưa đánh giá.
- Không thay ID hoặc xóa content cũ âm thầm. Ghi migration/thay version khi cần.
- Không sửa file lock thủ công. Không commit node_modules, dist, .env, private keys hoặc save cá nhân.
- Hàm engine thuần, không mutate input. Thay đổi resource là giao dịch nguyên tử, không cho số âm.
- Thêm test hành vi cho rules/bug quan trọng; không viết test chỉ lặp lại chi tiết implementation.
- Không khai báo đã build/test thành công khi chưa chạy. Ghi rõ giới hạn và lỗi còn tồn tại.

## Lệnh kiểm tra

```sh
npm ci
npm run check
npm run demo -- --seed 42 --path direct
npm run simulate -- --seeds 1000 --output artifacts/simulation.json
```

`check` chạy validate bản đồ, Vitest và production build. `demo` phải thắng, round trip save/load và replay tương đương. Simulation phải báo rõ thắng/thua/softlock; không xem việc bot chưa đạt mục tiêu là thắng.

## Giao hàng

- Tài liệu bằng tiếng Việt; identifier và code bằng tiếng Anh.
- Báo cáo chức năng thật, file chính, lệnh đã chạy, kết quả, cách chạy và giới hạn sau mỗi phase.
- Repository đã được người dùng cho phép đồng bộ với `origin`; dùng commit rõ nghĩa và push thường, không force push.

# Kiến trúc LAST CONVOY

## Luồng trạng thái

Adapter → GameCommand + trusted authority → validate → atomic transition → domain events + command log → invariant checks → GameState mới → read models/UI.

Core không phụ thuộc React/DOM/storage/network. Trên server tương lai, authority đến từ session đã xác thực; client không được tự đặt quyền qua issuerId. Chưa có server multiplayer trong MVP.

## Module

| Đường dẫn | Trách nhiệm |
|---|---|
| src/core | State/version, RNG, command processor, invariants, resources, events và replay |
| src/world | Graph definition/schema/reference validation, access và route costs |
| src/content | Content versioned theo ID ổn định |
| src/persistence | Save envelope, migration, load/replay verification và injected storage |
| src/simulation | Các bot/scenario dùng đúng command API |
| scripts | CLI và filesystem adapters |
| src/client | React read models/command dispatch; không giải quyết rules |
| tests | Hành vi engine, save, content, simulation |

Event/Quest/Combat/Skill/Artifact và asset registry được bổ sung trong Phase 2–5 theo PHASE_PLANS.md, không giả lập bằng các field reserved.

## Determinism và version

Mulberry32-v1 lưu seed/state/draw count, không dùng Math.random hoặc đồng hồ hệ thống. ID event và sequence phụ thuộc state. Cùng initial seed + engine/content version + command history tạo cùng state/events. Canonical JSON loại khác biệt thứ tự object keys.

State schema v1, engine 0.1.0, content `0.1.0-foundation.1`; save envelope v1 hỗ trợ development v0. Save chứa snapshot và accepted-command log, load replay toàn bộ và đối chiếu. Đây là kiểm tra integrity, không phải chữ ký chống gian lận. Chỉ load đúng phiên bản content; migration schema không tự biến đổi rules/content cũ.

## Rule logistics

Tick 60 phút. Living crew tiêu food/water từng tick; travel thêm fuel và roll hazard. Travel là turn nguyên tử, arrival được ghi nhận kể cả nếu xe bị phá hủy trên đường (thua). Refuge cho phép đến bằng khẩu phần cuối; ở nơi khác thiếu một tick supplies sẽ thua. Invalid command không ghi log hoặc tiêu RNG. Khoảng 30–60 phút thực tế cần playtest sau Phase 5.

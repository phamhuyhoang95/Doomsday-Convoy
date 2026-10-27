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

`src/narrative/` chứa allowlist conditions/effects, event director, weighted outcomes, hooks, world-fact/knowledge evaluator và Story Contracts. Quest sinh từ preconditions/dependencies rồi giải bằng success/failure/alternate, không cần chuỗi event ID. `src/combat/` xử lý turn order/AI/skills/loot/capture; `src/world/npc.ts` xử lý mục tiêu đối thủ. `src/assets/` resolve ID/fallback; URI không được engine gameplay sử dụng.

## Determinism và version

Mulberry32-v1 lưu seed/state/draw count, không dùng Math.random hoặc đồng hồ hệ thống. ID event và sequence phụ thuộc state. Cùng initial seed + engine/content version + command history tạo cùng state/events. Canonical JSON loại khác biệt thứ tự object keys.

Hiện tại state/save schema **v3**, engine 0.1.0, logistics content `0.1.0-foundation.1`, campaign content `0.1.0-campaign.4`. Save chứa snapshot và accepted-command log, load replay toàn bộ và đối chiếu. Có migration development envelope v0, logistics state/save v1 và v2; future version bị từ chối. Đây là kiểm tra integrity, không phải chữ ký chống gian lận. Chỉ load đúng phiên bản content; migration schema không tự biến đổi rules/content cũ. Muốn hỗ trợ campaign cũ cần giữ bundle rules/content tương ứng, chưa có kho bundle lịch sử trong MVP.

## Rule logistics

Tick 60 phút. Living crew tiêu food/water từng tick; travel thêm fuel và roll hazard. Event/combat/skill/investigate đều tiêu 1 tick, wait 1–12 ticks. Travel là turn nguyên tử, arrival được ghi nhận kể cả nếu xe bị phá hủy trên đường (thua). Refuge cho phép đến bằng khẩu phần cuối; ở nơi khác thiếu một tick supplies sẽ thua. Invalid command không ghi log hoặc tiêu RNG.

Sau player action, rival xử lý các hành động đến hạn trên world clock, quest contracts cập nhật, event director chọn situation eligible và terminal condition được giải. Enemy combat actions chạy tới lượt player tiếp theo trong cùng transaction. Kết quả terminal ưu tiên xe/crew còn hoạt động, sau đó ending contract theo facts/ownership, rồi thất bại supplies. Không có background timer.

## Combat / ownership / narrative

Một turn order chứa actor IDs, một player action mỗi lượt, energy/cooldown theo actor. Damage/heal/guard/reveal là operator kỹ năng; không switch theo skill ID. Enemy AI dùng RNG riêng của state. Combat victory chuyển loot/owner ngay và sang aftermath cho capture/finish; finish bỏ lại downed NPC thành dead. Surrender giao kỳ vật, retreat tiêu fuel và có xác suất thành công. Captives vẫn giữ convoy gốc để truy nguyên, status/facts ghi việc bị player bắt (MVP có một captor).

Artifact definition bất biến; mỗi loại có một instance và ownerId nằm trong convoy/location registry. Rescue thay roster và chi phí khẩu phần. NPC có convoy/vehicle/resources/location/goal/intent/nextActionTick; có thể sở hữu cùng mirror instance và làm nhánh ward chuyển sang truy dấu.

Validator tĩnh kiểm tra schema/operators/IDs/refs/weights/costs/free fallback/dependency cycles/ending fallback và các contract rõ ràng không có terminal. Nó không chứng minh SAT cho mọi condition hoặc tính solvable của mọi trạng thái; scenario/bot tests kiểm tra các tuyến quan trọng và fallback cụ thể.

## Giới hạn vận hành

Save giữ toàn log và replay khi serialize/load; phù hợp chiến dịch nhỏ, cần snapshot/checkpoint optimization khi log rất dài. LocalStorage có quota và cùng-origin, có xử lý lỗi ghi/đọc. Core chưa có networking, xác thực session, concurrent command ordering hoặc chống gian lận server. Thời lượng 30–60 phút cần human playtest.

# Kiến trúc LAST CONVOY

## Luồng trạng thái

Adapter → GameCommand + trusted authority → validate → atomic transition → domain events + command log → invariant checks → GameState mới → read models/UI.

Core không phụ thuộc React/DOM/storage/network. Trên server tương lai, authority đến từ session đã xác thực; client không được tự đặt quyền qua issuerId. Chưa có server multiplayer trong MVP.

Art A2 thêm presentation catalog riêng tại `src/client/art/`, lookup theo stable ID trước content fallback. Master/prompt/receipt ở `art/`, bản web ở `public/art/a2/`; engine/content version/save không đổi vì thay ảnh. Map art/portrait crop/combat environment/report layout là phần client. Xem [ASSET_PIPELINE](../assets/ASSET_PIPELINE.md) và [HANDOFF](../ai/HANDOFF.md) cho trạng thái A2 và việc QA đang dừng.

## Module

| Đường dẫn | Trách nhiệm |
|---|---|
| src/core | State/version, RNG, command processor, invariants, resources, events và replay |
| src/world | Graph definition/schema/reference validation, access và route costs |
| src/content | Content versioned theo ID ổn định |
| src/expedition | Recon/intel/cache, rest/repair và progression/upgrades/stances |
| src/read-models | Skill/effect preview và transition report từ state/domain events |
| src/persistence | Save envelope, migration, load/replay verification và injected storage |
| src/simulation | Các bot/scenario dùng đúng command API |
| scripts | CLI và filesystem adapters |
| src/client | React read models/command dispatch; không giải quyết rules |
| tests | Hành vi engine, save, content, simulation |

`src/narrative/` chứa allowlist conditions/effects, event director, weighted outcomes, hooks, world-fact/knowledge evaluator và Story Contracts. Quest sinh từ preconditions/dependencies rồi giải bằng success/failure/alternate, không cần chuỗi event ID. `src/combat/` xử lý turn order/AI/skills/loot/capture; `src/world/npc.ts` xử lý mục tiêu đối thủ. `src/assets/` resolve ID/fallback; URI không được engine gameplay sử dụng.

## Determinism và version

Mulberry32-v1 lưu seed/state/draw count, không dùng Math.random hoặc đồng hồ hệ thống. ID event và sequence phụ thuộc state. Cùng initial seed + engine/content version + command history tạo cùng state/events. Canonical JSON loại khác biệt thứ tự object keys.

Hiện tại state/save schema **v3**, engine 0.1.0, logistics content `0.1.0-foundation.1`, campaign mới `0.1.0-campaign.5-r1`. Các fields operations/progression là optional additive. Rules mới được bật bởi campaign.operations; bundle `.4` tại `src/content/archive/campaign-v4.json` giữ command semantics cũ. Fixtures được tạo bằng code Git `8f987d7` kiểm tra snapshot/replay cũ thật. `src/persistence/compatible.ts` chọn definition và namespace slot đúng, không âm thầm fallback khi save R1 hỏng. Trong một chuyến legacy, tải thủ công vẫn dùng slot legacy.

Save chứa snapshot và accepted-command log, load replay toàn bộ và đối chiếu. Có migration development envelope v0, logistics state/save v1 và v2; future version bị từ chối. Đây là kiểm tra integrity, không phải chữ ký chống gian lận. Chỉ load đúng phiên bản content; migration schema không tự biến đổi rules/content cũ.

## Rule logistics

Tick 60 phút. Living crew tiêu food/water từng tick; travel thêm fuel và roll hazard. Event/combat/skill/investigate đều tiêu 1 tick, wait 1–12 ticks. Travel là turn nguyên tử, arrival được ghi nhận kể cả nếu xe bị phá hủy trên đường (thua). Refuge cho phép đến bằng khẩu phần cuối; ở nơi khác thiếu một tick supplies sẽ thua. Invalid command không ghi log hoặc tiêu RNG.

R1: train-actor/set-stance là command hợp lệ **0 tick**, vẫn log/replay nhưng không tiêu khẩu phần. Recon lưu theo location: cache/XP một lần, intel có hạn giảm riskBps thực tế của travel. Nghỉ hồi HP/energy người active; repair tiêu scrap và hồi condition có trần. Dữ liệu rest/recon/progression/upgrades/stances nằm trong content, không nằm trong React.

Sau player action, rival xử lý các hành động đến hạn trên world clock, quest contracts cập nhật, event director chọn situation eligible và terminal condition được giải. Enemy combat actions chạy tới lượt player tiếp theo trong cùng transaction. Kết quả terminal ưu tiên xe/crew còn hoạt động, sau đó ending contract theo facts/ownership, rồi thất bại supplies. Không có background timer.

## Combat / ownership / narrative

Một turn order chứa actor IDs, một player action mỗi lượt, energy/cooldown theo actor. Damage/heal/guard/reveal là operator kỹ năng; không switch theo skill ID. Enemy AI dùng RNG riêng của state. Combat victory chuyển loot/owner ngay và sang aftermath cho capture/finish; finish bỏ lại downed NPC thành dead. Surrender giao kỳ vật, retreat tiêu fuel và có xác suất thành công. Captives vẫn giữ convoy gốc để truy nguyên, status/facts ghi việc bị player bắt (MVP có một captor).

Artifact definition bất biến; mỗi loại có một instance và ownerId nằm trong convoy/location registry. Rescue thay roster và chi phí khẩu phần. NPC có convoy/vehicle/resources/location/goal/intent/nextActionTick; có thể sở hữu cùng mirror instance và làm nhánh ward chuyển sang truy dấu.

Encounter phụ dùng roster/resources/location/terminal fact IDs từ content. Thắng/capture/retreat ở chợ không giải nhầm main rival; Tro Tàn tiếp tục clock khi người chơi đánh encounter phụ. Damage command/skill chỉ nhắm actor tham gia trận hiện tại. UI damage range dùng cùng formula với resolver. Transition report dùng trước/sau và events, không tự thay đổi state. Web Audio nằm hoàn toàn trong client, không đi vào RNG/log/save gameplay.

Validator tĩnh kiểm tra schema/operators/IDs/refs/weights/costs/free fallback/dependency cycles/ending fallback và các contract rõ ràng không có terminal. Nó không chứng minh SAT cho mọi condition hoặc tính solvable của mọi trạng thái; scenario/bot tests kiểm tra các tuyến quan trọng và fallback cụ thể.

## Giới hạn vận hành

Save giữ toàn log và replay khi serialize/load; phù hợp chiến dịch nhỏ, cần snapshot/checkpoint optimization khi log rất dài. LocalStorage có quota và cùng-origin, có xử lý lỗi ghi/đọc. Core chưa có networking, xác thực session, concurrent command ordering hoặc chống gian lận server. Thời lượng 30–60 phút cần human playtest.

## Bundle Resonance — 2026-10-29

`0.3.0-campaign.1-resonance` từng là mặc định client trước Lamplight; giữ resolver/content/slots Journey/O1/R1/.4. `src/occult/` quản lý nghi thức qua command0giờ, XP tích lũy riêng spentXp và di vật chung. Chapter/objectives/codex là read model từ facts/knowledge/location visits, không có chapter script chạy trong React. Twelve abilities dùng operator tactical chung với optional fields additive; không sửa legacy-engine. Flow opening local và quyền phát/skip/fallback nằm ở client, không can thiệp log/RNG. Xem [báo cáo và gates](../reports/RESONANCE_IMPLEMENTATION.md).


## Lamplight — khám phá trực tiếp, 30/10/2026

Client mặc định `0.4.0-campaign.1-lamplight`, slot `lamplight-*`; các bundle cũ giữ nguyên. State/save v3 thêm optional `fieldwork`, command/event mới chỉ có hiệu lực với config này. `src/fieldwork/geometry.ts` và `engine.ts` thuần TypeScript: vị trí nguyên, cửa, LOS, pin, tiếng động và shadow BFS là authority. Renderer SVG nội suy và đổ sáng; không dùng FPS/clock hệ thống để giải luật. Đứng yên dừng local beat. Entry trả 2 giờ cùng khẩu phần một lần; microaction/return không tăng giờ thế giới. Phần thưởng chỉ áp dụng khi về xe, hoàn tất site một lần; rescue có thiệt hại và bỏ cargo.

Scenario chọn resolver mới khi bundle có `campaign.fieldwork`; `legacy-engine.ts` giữ nguyên byte resolver cũ. Role/cost/effect/cargo nằm trong content. Một state Scenario cho chiến dịch hiện tại, chưa phải hệ thống nhiều Scenario nối tiếp. Fieldwork có completedSiteIds và một expedition hiện hành; đợt này chỉ có site Thánh An.

Client không tự sửa vị trí/HP/loot. Autosave field debounce 650ms, flush khi rút/save/menu/load/pagehide/visibilitychange; invariant và full replay vẫn chạy khi serialize. Crash cưỡng bức trong cửa sổ chờ có thể mất bước cuối. [Plan](../plans/LAMPLIGHT_FIELD_EXPLORATION.md), [báo cáo/gates](../reports/LAMPLIGHT_IMPLEMENTATION.md).

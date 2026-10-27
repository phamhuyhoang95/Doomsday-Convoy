# LAST CONVOY — kế hoạch triển khai chi tiết

Cập nhật: 2026-10-27, Asia/Ho_Chi_Minh. Phạm vi được người dùng mở rộng đến hết Phase 5. Mỗi phase phải có plan trước khi viết code. Đây là file kế hoạch; **PROGRESS.md là nhật ký tiến trình và điểm tiếp tục chính thức**. Không coi checklist chưa được xác minh là đã hoàn tất.

## Phase 0 — Foundation

1. Kiểm tra repository và chỉ dẫn hiện có; bảo toàn code. Thư mục ban đầu trống, đã kết nối repository GitHub của người dùng.
2. Thiết lập npm, TypeScript strict, React/Vite, Zod, Vitest và lockfile. Tách client khỏi engine.
3. Tạo README, AGENTS, GAME_BIBLE, ARCHITECTURE, MVP_SCOPE; mô tả rõ chức năng hiện có và phần chưa triển khai.
4. Tạo trang kiểm tra nền tảng, không gắn nhãn là gameplay hoàn chỉnh.
5. Kiểm tra cài đặt sạch, typecheck, test runner và production build. Dùng runtime Node được toolchain hỗ trợ.

**Đầu ra:** cấu hình gốc, tài liệu, `src/client/`. **Done:** dependency cài được, Vitest chạy được, build thành công. **Rủi ro:** Node hệ thống đang là 23; Vitest mới hỗ trợ 22/24, cần xác minh bằng runtime được hỗ trợ.

## Phase 1 — Headless engine

1. Hoàn thiện schema GameState/version; actor/convoy/world/facts/knowledge và chỗ dành cho các hệ thống sau.
2. Mulberry32 có seed, state và draw count; kiểm thử determinism và giới hạn seed.
3. Command envelope có ID, issuer và authority từ adapter. Validate trước khi thực hiện; từ chối nguyên tử không đổi tick/RNG/log.
4. Graph map theo dữ liệu: 8 địa điểm/11 tuyến, một chiều/hai chiều, access flags, fuel/time/risk. Tách world definition với world state.
5. Travel/wait tiêu hao đủ tài nguyên, cập nhật tick, xe và discovery; domain events có thứ tự.
6. Command log và replay xác minh cả RNG/events. Save envelope có version, migration v0→v1, kiểm tra content version và lịch sử.
7. Adapter localStorage có dependency injection, CLI hành trình với save/load giữa đường và round trip file.
8. Tests: từ chối lệnh, quyền, resources, routes, deterministic, events, replay, save và corruption/migration.
9. Bot simulation đa seed: direct/detour/bypass/wander/exhaustion, thống kê thắng/thua/softlock, xuất JSON.

**Đầu ra:** `src/core/`, `src/world/`, `src/persistence/`, `src/simulation/`, `scripts/`, `tests/`. **Done:** chạy ba tuyến headless, replay và save/load tương đương, build/tests xanh. **Checkpoint:** báo cáo thực tế vào PROGRESS trước Phase 2.

## Phase 2 — Event, Quest & Narrative

1. Lập schema registry chung cho location/event/quest/skill/artifact/anomaly/character/asset. Operator condition/effect là union được allowlist, không chạy code từ data.
2. Condition evaluator đọc resources, facts, knowledge, location, actor/convoy và ownership; phân biệt facts khách quan với knowledge đã khám phá.
3. Effect executor dùng transaction trong command processor: resources, facts, knowledge, crew/world flags, artifact ownership và hook bắt đầu combat qua dữ liệu.
4. Event director theo location/tags/trigger/spawn rules, một lần hoặc giới hạn lần; weighted outcomes dùng engine RNG. Command investigate/choose có requirements/costs/outcomes.
5. Story Contract: preconditions/dependencies/objectives/progress/success/failure/alternate resolution; quest template sinh từ facts. Evaluate sau mỗi command, không ép chuỗi event ID.
6. Đặt quest bảo đảm đường vòng khi NPC chết, kỳ vật đổi chủ, hospital đóng; thông tin objective thể hiện bằng fact/ownership, không chỉ click dialogue.
7. CLI validate content: duplicate IDs, refs, operator, weights, costs hợp lệ, nhánh terminal/fallback và contract có cách giải quyết.
8. Test event resolution/conditions/atomic costs/quest alternatives/fallback; cập nhật save schema/migration theo thay đổi thực tế. Viết CONTENT_GUIDE với ví dụ thêm event/skill/artifact/region.

**Done:** thêm event chỉ bằng data, lựa chọn đổi state thật, quest cập nhật đúng, fallback được test; tests cũ còn chạy. **Rủi ro:** schema thay đổi phải giữ compatibility có chủ ý và không trộn game rules vào UI.

## Phase 3 — Combat, Skill & Artifact

1. Actor attributes, team/turn order/AP, health/downed/captured; trạng thái NPC convoy và mục tiêu di chuyển/đàm phán theo world tick.
2. Combat command attack/defend/use-skill/retreat/negotiate/surrender/capture; kiểm tra active actor, target, costs/cooldown và trạng thái downed.
3. Enemy AI deterministic; chuyển lượt, end combat, casualties, vehicle/resource consequences và loot transaction.
4. Bốn skill theo dữ liệu (damage/heal/defend/investigate), không thêm switch theo skill ID trong engine.
5. Hai artifact instance có owner duy nhất; transfer khi nhận/đổi/cướp/loot, validate ownership invariant; artifact effects định nghĩa bằng data.
6. Anomaly chính có quy tắc và manh mối: điều tra/knowledge thay đổi cách xử lý, vi phạm rule chịu hậu quả bằng engine.
7. Rival có mục tiêu và phản ứng theo artifact/reputation/casualties. Bảo đảm death/capture/ownership đổi không khóa story.
8. Test turn resolution/determinism/skill requirements/retreat/negotiation/downed-capture/loot/ownership và ba cách giải quyết confrontation.

**Done:** headless campaign có combat và lựa chọn hòa bình, kỹ năng và chuyển ownership hợp lệ, save/replay tiếp tục qua combat.

## Phase 4 — Playable UI

1. Thay trang nền tảng bằng main menu/new run/seed/continue, hiển thị phiên bản và lỗi save dễ hiểu.
2. World map SVG graph, route preview có time/cost/risk và disable theo read model; travel command từ adapter.
3. Dashboard tài nguyên/xe/tick/crew, character detail/skill, inventory/artifact, quest journal/knowledge/world log.
4. Event dialogue đọc text/choices từ content, show requirement/cost, resolve bằng command; không hardcode outcome trong React.
5. Combat screen hiển thị team/turn/health/downed, controls attack/defend/skill/retreat/negotiate/surrender/capture, target selection.
6. Save/load/new run controls dùng LocalSaveStore, responsive keyboard-accessible UI và feedback command error.
7. Kết cục tổng hợp hành động thật, replay/new seed. Dev panel điều tra events/quests/facts/log không tự sửa state.
8. Chạy browser smoke và chơi ít nhất một hành trình đủ ba màn, kiểm tra lưu/reload.

**Done:** chơi được từ menu đến ít nhất hai kết cục hợp lệ trên browser; engine tiếp tục chạy độc lập UI.

## Phase 5 — Content, Polish & QA

1. Hoàn thiện khoảng 12 event trong 8 địa điểm qua ba màn: rời thành phố/cứu người, bệnh viện và rule anomaly, rival tranh kỳ vật.
2. Kết cục dựa trên survivors/knowledge/ownership/tình trạng rival; tune chi phí/travel/combat để có nhánh khả thi và thất bại hợp lệ.
3. Asset registry ID ổn định cho location/event/portrait/skill/artifact/vehicle/anomaly/sound/FX; SVG/CSS placeholders, fallback không asset không làm hỏng logic. Chỉ thêm sound nếu có asset.
4. Debug tools cho event eligibility/contracts/command log; cập nhật guide thêm content và architecture.
5. Bot simulation nhiều seed cho campaign, peaceful/aggressive/fallback strategies, thống kê win/loss/softlock/rejected commands, save/replay checks.
6. Phủ đủ 14 nhóm automated tests trong master plan: determinism, invalid commands, nonnegative resources, travel, conditions, choices, quest alternatives, ownership, combat, saves, refs, replay, NPC death/ownership fallback và expected campaign routes.
7. Chạy clean install/typecheck/content validator/tests/build; browser QA desktop/mobile và save/load. Sửa lỗi rồi chỉ chạy lại các kiểm tra liên quan và full gate cuối.
8. Cập nhật README/report/PROGRESS với kết quả đo được, hạn chế (đặc biệt thời lượng chiến dịch 30–60 phút nếu chưa playtest con người), commit và push checkpoint lên remote đã được ủy quyền.

**Done:** MVP chạy end-to-end trên browser và headless, thắng hoặc thua hợp lệ, save/replay hoạt động, không softlock trong các tuyến và seed đã kiểm tra; báo rõ giới hạn chưa kiểm chứng.

## Quy trình checkpoint bắt buộc

- Trước khi bắt đầu phase: đọc plan phase đó, bổ sung quyết định cụ thể nếu scope đổi rồi mới code.
- Sau mỗi phần lớn: cập nhật PROGRESS với file/function đã có, lệnh và exit code thực, vấn đề còn mở, bước tiếp theo.
- Sau mỗi phase: báo người dùng ngắn gọn và ghi báo cáo chi tiết vào file; tiếp tục phase kế theo ủy quyền mới đến hết Phase 5.
- Khi hết context: đọc `AGENTS.md`, `PHASE_PLANS.md`, `PROGRESS.md`, `git status`, rồi tiếp tục từ mục NEXT. Không khởi tạo lại hay xóa công việc.

## Kết quả thực hiện

2026-10-28: Phase 0–5 đã được triển khai theo plan và kiểm tra. Đối chiếu `PROGRESS.md` và `QA_REPORT.md` cho gate từng phase, lệnh và bằng chứng thực tế. Không bắt đầu thêm phase ngoài phạm vi nếu chưa có yêu cầu mới. Human playtest mục tiêu thời lượng/độ khó là việc tiếp theo được đề xuất, chưa được xác nhận bằng bot.

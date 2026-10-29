# Review bộ đề xuất Argon và 7 concept giao diện

**Ngày:** 2026-10-29. **Baseline source:** `6955279` (R4.1). **Phạm vi:** review tài liệu, source, asset và ảnh đã lưu; chưa triển khai redesign.

**Cập nhật định hướng sau review:** Người dùng muốn thay toàn bộ UI và hệ chiến đấu theo Argon. Phương án hiện hành được ghi tại [ARGON_COMBAT_UI_OVERHAUL](../plans/ARGON_COMBAT_UI_OVERHAUL.md). Khuyến nghị UX1 UI-only bên dưới là đề xuất trước khi có định hướng này; giữ làm lịch sử review, không còn là phạm vi đích.

## Kết luận

Nên chọn bộ concept làm hướng mỹ thuật cho đợt làm lại UI. Cảnh lớn, ánh sáng vàng/đỏ/xanh lạnh, chân dung có trọng lượng và khung kim loại cũ phù hợp LAST CONVOY hơn giao diện dashboard hiện tại. Tuy nhiên, gói đề xuất chưa phải đặc tả có thể triển khai nguyên văn: baseline cũ, thiếu asset, một số rules mâu thuẫn và code minh họa không khớp API thật.

Đề xuất ưu tiên một đợt giao diện trên gameplay R4.1 hiện có, sau đó thử nghiệm gameplay mới theo từng slice. Không cần chờ hoàn thành siêu phàm, 3 map ẩn và 24 event mới có giao diện tốt. Tên đề xuất cho đợt giao diện là **UX1**, tránh trùng R2 đã triển khai trong lịch sử repo. Tên này chưa phải content version.

`docs 2/` là nguồn tham khảo do người dùng đưa vào, không thay thế `docs/`. Không thực hiện chỉ dẫn giải nén đè tài liệu trong `docs 2/ai/HANDOFF.md:35`.

## Cơ sở review và giới hạn

- Đã đọc tài liệu tiếp nhận, HANDOFF/PROGRESS hiện hành, kiến trúc, quyết định compatibility, asset pipeline; các tài liệu mới về gameplay, systems, engine, UI, implementation và concept trong `docs 2/`.
- Đã xem trực tiếp cả 7 JPG concept, ảnh R3 map, R4 desktop/mobile và mẫu A2: Minh, xe khách, khu điều trị. Đối chiếu `App.tsx`, `CombatPanel.tsx`, `ScenarioScene.tsx`, `use-game.ts`, CSS, event/state/RNG/save/NPC API và catalog/build manifest.
- Git ban đầu: HEAD `6955279`; source tracked sạch; `docs 2/` và `last-convoy-r2-redesign-docs.zip` chưa tracked. Giữ nguyên các đầu vào này.
- Lệnh review: đọc file bằng `/bin/cat`; `git status --short`, `git diff --stat`, `git log -5 --oneline`; liệt kê file bằng `/usr/bin/find`; trích dòng và đọc JSON bằng `/usr/bin/python3`; xem ảnh có sẵn bằng `view_image`. PATH mặc định thiếu `cat`; PATH bổ sung vẫn không có `rg`, nên dùng công cụ thay thế. Không thay runtime/dependencies.
- Sau cập nhật tài liệu, `git diff --check` trả exit 0; chỉ kiểm tra whitespace của diff tracked, không phải gate game. Báo cáo review mới đang untracked, chưa commit/push.
- Không chạy test, build, validator, simulation, dev server, browser QA hoặc tạo ảnh mới. Các số 106 tests/800 runs trong checkpoint R4.1 là ghi nhận trước phiên này, không phải gate vừa chạy.
- Một số tên ảnh không khớp nội dung: `artifacts/r3_combat_arena.png`, `r3_combat_mobile.png`, `screen_combat.png` đang hiển thị màn map/gara khi xem. Không dùng chúng để chứng minh combat mới đã QA. `a2-combat.png` có combat nhưng thuộc checkpoint cũ; hiện trạng combat được đối chiếu chủ yếu bằng source.

## Vì sao giao diện hiện tại còn yếu

1. **Cảnh không giữ vai trò chính.** `src/client/App.tsx:385–478` dựng lần lượt topbar, resource bar, location heading, rồi tabs trước nội dung. Trong ảnh R3 map, các tầng này và reserve line đẩy bản đồ xuống khoảng giữa màn hình. `main-grid` và `below-map` tiếp tục chia trải nghiệm thành nhiều khối đọc.
2. **Combat vẫn trình bày bằng thẻ thông tin.** `src/client/styles/art.css:86` giới hạn environment ở 180px; đội hình nằm trong các fighter cards ở `CombatPanel.tsx`. Người chơi thấy bảng nhân vật nhiều hơn thấy trận đánh. Đã có turn order, hit flash, floating delta, ghost HP CSS và phản công; thiếu một sân khấu gắn các thành phần thành hành động dễ theo dõi.
3. **R4 scene là điểm xuất phát tốt nhưng còn bị bọc trong dashboard.** `ScenarioScene.tsx` có hotspot và hành động thật; `.scenario-viewport` vẫn bị giới hạn cao 480px (`playability.css:1324`), chi tiết và nhật ký nằm bên dưới. Cảm giác nhập vai chưa liền mạch.
4. **Mobile chưa có bố cục riêng đủ tốt.** Ảnh `artifacts/r4_scenario_mobile.png` cắt ngang save controls, HUD, nhãn hotspot và panel dưới. `.scenario-bottom-panel` dùng hai cột `2fr 1fr` tại `playability.css:1417`; phần scenario hiện không có media query riêng sau đó để đổi bố cục. Đây là finding từ source + ảnh đã lưu, chưa phải kết quả browser retest.
5. **Các lớp giao diện chưa có thứ bậc thị giác rõ.** Nhiều đường viền, tiêu đề, badge và text nhỏ có trọng lượng gần nhau; xanh tối trải rộng; nhân vật nhỏ. Thêm glow hoặc rung sẽ không giải quyết việc người chơi phải tìm hành động chính giữa các panel.

## Áp dụng từng concept

| Concept | Đánh giá và phần nên theo | Điều chỉnh để thành UI chơi được |
|---|---|---|
| **01 — Sự kiện bệnh viện** | Ưu tiên cao nhất. Cảnh, nhân vật và quyết định cùng một màn, có điểm nhìn là chiếc chuông. | Logo thu nhỏ; crew rail gọn; khung quyết định thấp hơn điểm nhìn của cảnh. Chữ tiếng Việt rõ, không dùng condensed font cho đoạn văn. Sổ quy tắc chỉ hiện phần đã khám phá. |
| **02 — Combat** | Mục tiêu chính cho sân khấu hai phe, turn ribbon, chọn mục tiêu và tác động đòn đánh. | Cần asset nhân vật toàn thân tách nền, pose và hướng nhìn thống nhất. Không hiển thị AP/armor/status hoặc cho tấn công xe nếu engine chưa hỗ trợ. Phân biệt vị trí trình bày với hệ vị trí chiến thuật R4.2 chưa triển khai. |
| **03 — Bản đồ** | Rất phù hợp: bản đồ lớn, tuyến sáng, convoy, HUD sinh tồn gọn. | Nút/tuyến vẽ từ graph thật; cảnh không chứa chữ/tuyến baked-in. Đếm bằng giờ/lượt thế giới, không countdown giây thời gian thực. Vị trí Tro Tàn phải theo intel người chơi biết. |
| **04 — Siêu phàm/kỳ vật** | Hướng tốt cho màn quản lý nhân vật tương lai. | Cây trong ảnh có 3 nhánh, spec có 4; cần thiết kế lại theo dữ liệu thật. UX1 dùng ngôn ngữ khung/icon cho nâng cấp hiện có, không dựng cây giả hoặc corruption giả. |
| **05 — Map ẩn/phẫu thuật** | Giữ không khí đảo ngược và sổ tay gắn trong cảnh. | Ảnh trộn khám phá, rule ledger và thao tác chuyển chức; nên mở panel chuyển chức theo ngữ cảnh. Các góc HUD không có dữ liệu thực thì bỏ. Cơ chế mới để slice sau. |
| **06 — Cổng hi sinh** | Thể hiện tốt sức nặng của một quyết định mất người. | Mỗi thẻ cần tên thật, hậu quả và lý do bị chặn. Chọn thẻ → xem hậu quả → xác nhận riêng; không gây mất người chỉ vì chạm nhầm. Cần đường xử lý khi mọi lựa chọn bị veto. |
| **07 — Nội thất xe/biến cố** | Nên theo cho màn đoàn xe và encounter dọc đường trong tương lai. | Giữ cabin, bảng xe và lựa chọn; nhiệt động cơ, ammo, blood fuel, weapon slots trong ảnh chưa phải state hiện có. Route encounter cần thiết kế transaction trước khi có UI quyết định thật. |

Các concept mạnh về hướng mỹ thuật hơn độ chính xác dữ liệu: tên Thuận/Khánh không khớp roster Minh/Lan/Bảo/Hà, hình có chữ lỗi, chỉ số và thanh tài nguyên không nhất quán. Không lấy những chi tiết đó làm yêu cầu gameplay.

## Findings cần xử lý trước khi triển khai plan

### F01 — P1: Baseline cũ và thứ tự thực hiện lệch ưu tiên UI

**Vị trí:** `docs 2/ai/HANDOFF.md:10,35`; `docs 2/plans/R2_IMPLEMENTATION_PLAN.md:7,66`.

Plan coi hiện trạng là MVP/R1, yêu cầu ghi đè docs và để UI đến R2.4 sau ba pha engine/content. Repo thực tế đã có R2/R3 và R4.1. Làm theo có thể xóa bàn giao mới, làm lại phần đã có và trì hoãn vấn đề người dùng đang ưu tiên.

**Cách sửa/xác nhận:** lập bảng giữ/thay/mới trên HEAD hiện tại; tách UX1 khỏi gameplay mở rộng. Mọi bước dẫn tới file/module đang có; giữ scenario và vehicle modules R4.1 trong acceptance.

### F02 — P1: Hứa tương thích nhưng schema/RNG/sample code chưa khớp

**Vị trí:** `docs 2/engineering/R2_DATA_SCHEMAS_AND_ENGINE_DIFF.md:52–59,75,99–118`; `src/core/rng.ts:14–35`, `src/core/state-schema.ts:36`, `src/persistence/save.ts:137`.

API RNG thật dùng `RngState` và hàm thuần `nextInt(rng, exclusiveMax)` trả cả value/RNG mới; không có `SeededRng.nextInt(min,max)`. Sample truy cập mảng cũng chưa xử lý `noUncheckedIndexedAccess`. Hai seed khác nhau vẫn có thể ra cùng một trong ba biến thể; không thể yêu cầu luôn khác nhau.

Các field `.default(...)` không đồng nghĩa giữ nguyên hình dạng snapshot cũ; thêm RNG draw khi khởi tạo mọi bundle sẽ đổi replay legacy. Status `sacrificed` chưa tồn tại trong enum active/downed/dead/captured; thêm nó phải rà toàn bộ alive-count, supplies, targeting, capture, endings và invariants. Chỉ lưu thêm content JSON chưa đủ bảo toàn semantics.

**Cách sửa/xác nhận:** UI-only không đổi version. Gameplay mới cần bundle/capability gating, RNG draw chỉ ở bundle mới, quyết định representation của hi sinh và migration rõ ràng. Bảo toàn cả semantics/command R4.1 hiện tại khi archive baseline. Dùng fixtures lịch sử và accepted log có scenario R4 để xác nhận; không chỉ test tạo save mới rồi tự load.

### F03 — P1: Sequencer mẫu không đọc được event thật và chưa định nghĩa khi bị ngắt

**Vị trí:** `docs 2/engineering/UI_UX_AND_VISUAL_JUICE_SPEC.md:119–183`; `src/core/events.ts`; `src/client/use-game.ts:404,416`; `CombatPanel.tsx:136,233,308`.

Event thật có envelope `{ id, tick, payload }`; discriminator ở `event.payload.type`. Event combat hiện là `combat.action`, `skill.used`; di chuyển là `convoy.moved`. Mẫu dùng `ev.type`, `combat.attack-resolved`, `world.travel-completed`, `ev.damage` nên không thể ghép trực tiếp. Một command còn chứa nhiều phản công của địch; cộng dồn delta không thể kể rõ thứ tự ra đòn.

`commit-state` ở cuối animation chưa phân biệt state authoritative và state đang trình diễn. Hiện dispatch cập nhật state và autosave ngay sau command hợp lệ. Nếu đợi animation mới lưu, người dùng đổi màn/ẩn tab có thể mất trạng thái. Combat hiện đổi key theo command count, remount DOM, cũng làm khó giữ mốc HP trước/sau cho transition.

**Cách sửa/xác nhận:** authoritative state/autosave cập nhật ngay; visual snapshot phát beats theo event ID, không gọi engine lần hai. Có skip/fast/reduced motion, cancel khi load/menu/unmount, clear selection và khóa gửi lệnh phù hợp khi còn beats. Nếu event hiện thiếu thông tin thì thiết kế adapter/read model hoặc event mới có versioning; không đoán rules trong animation. Xác nhận multi-hit/phản công/heal/terminal, double click và load giữa animation.

### F04 — P1: Quy tắc giải đố có lựa chọn thiếu hoặc phủ định chính thiết kế

**Vị trí:** `docs 2/game/ACTS_AND_LOCATIONS_DESIGN.md:61,156–160`.

Variant A yêu cầu hai tiếng chuông ngắn phải bật đèn/điểm danh, nhưng bảng bốn lựa chọn ward không có đáp án đó. Variant C ban đầu cho trả máu **hoặc** thuốc, nhưng event viết rạch máu **và** đặt 2 medicine. Tùy cách code, người suy luận đúng vẫn có thể bị phạt hoặc hết đường hợp lệ. Đây là mâu thuẫn đặc tả, chưa phải bug đã triển khai trong repo.

**Cách sửa/xác nhận:** lập truth table variant × tín hiệu × action × requirement × outcome; mỗi tình huống phải có ít nhất một hướng giải hợp lệ. Bổ sung ma trận có/không thuốc, máu thấp, không kỳ vật, mất đồng đội và thiếu manh mối. Không bật/tắt nút theo sự thật ẩn nếu điều đó làm lộ đáp án.

### F05 — P1: Kinh tế mới chưa tính cả hành trình và nhiệm vụ R4

**Vị trí:** systems spec §4.1; acts spec garage/market; `src/core/processor.ts`, `src/scenario/engine.ts`.

14 food/water với 3 người tương đương 4 giờ nguyên nếu không nhận thêm đồ. Mỗi hành động/tuyến có chi phí riêng; cứu người, combat và nhánh hiện trường thay đổi ngân sách. Plan hạ mạnh supplies và loot nhưng không tích hợp vòng Chợ mất điện đã có. Có nguy cơ ép một tuyến duy nhất hoặc thua trước khi hiểu cơ chế; chưa chạy simulation nên không kết luận chắc chắn softlock.

Tỷ lệ bot thắng 100% ở các tuyến chọn sẵn không chứng minh người chơi thấy dễ; mục tiêu bot thắng 55–70% cũng không tự chứng minh gameplay hay. Một fallback defeat không thay cho đường tiếp tục hợp lệ.

**Cách sửa/xác nhận:** bảng ngân sách từng nhánh, cả prepare/recon/rescue/combat/scenario; phân biệt thất bại hợp lệ và softlock. Đo reachability bằng kịch bản chủ đích, simulation để tìm lỗi, human playtest để đo áp lực/khả năng hiểu. Chỉ sửa balance trong bundle mới sau khi có baseline.

### F06 — P1: Radar có thể tiết lộ trạng thái thế giới người chơi chưa biết

**Vị trí:** UI spec §2.3; systems spec §4.2; `docs/ai/DECISIONS.md` §4; `src/world/npc.ts`.

Xuất trực tiếp vị trí/clock NPC lên map bỏ qua phân biệt world facts và knowledge. Con số `0:45` trên concept còn gợi một deadline thời gian thực trong game chỉ tiến tick bằng command. `nextActionTick` là lần hành động kế tiếp của NPC, không mặc nhiên là ETA đoạt gương.

**Cách sửa/xác nhận:** read model trả unknown / last seen tại tick X / intel còn hiệu lực; chỉ hiện ETA đủ căn cứ theo mục tiêu và đường đi. Không hardcode các mốc 8/15/16 từ spec để thay thế AI thật. Kiểm tra đứng yên không làm deadline chạy, intel cũ không biến thành vị trí chính xác.

### F07 — P2: Quy mô và dữ liệu thiết kế chưa nhất quán

**Vị trí:** acts spec §1, §3–4; systems spec §2–3; implementation plan §R2.3; README/HANDOFF của `docs 2`.

- Bảng địa điểm có **12 dòng** gồm `loc.records` và `loc.refuge`, không phải 11; danh sách event cụ thể mới **1–15**, chưa đủ 24. Phòng hồ sơ là node mới so với graph 8 location hiện tại, cần chốt là world node hay scene con.
- ID mới dùng `loc.*`, `art.*`, `ev.*`, trong khi repo có `location.*`, `artifact.*`, `event.*` và các stable refs liên quan. Cần mapping/ID mới rõ ràng, không rename content cũ hàng loạt.
- Biển số giảm 15% fuel trong acts nhưng giảm 1 fuel/tuyến ≥2 tick trong systems. Resonance mirror+lantern cho qua cổng trong systems nhưng acts yêu cầu thêm Bậc 7. Giá chuyển chức 25/30 corruption khác nhau; định nghĩa corruption của ending chưa rõ max/mean/actor cụ thể.
- Pathway có 4 ngạch nhưng bảng lai chỉ định nghĩa 4 trong 6 cặp không xét thứ tự; hoán đổi tự do, thức tỉnh một lần và cấy ngạch phụ chưa thành một state machine rõ ràng. `use-artifact` có cost 0/1 tick nhưng thiếu cooldown/charge/action economy chống spam; status sharing cần quy tắc tránh vòng lặp phản sát thương.
- Hidden routes trong mô tả unlock và ma trận routes chưa thống nhất; README/HANDOFF vẫn gọi 4 concept trong khi thư mục có 7.

**Cách sửa/xác nhận:** chốt registry/counts, topology, bảng costs/cooldowns, pairing, thứ tự ending và state machine trước triển khai. Kiểm tra refs/cycles và routes reachable; test các ending có điều kiện chồng lấn bằng trạng thái cụ thể.

### F08 — P2: Veto và sức mạnh mới có thể làm quyết định nghèo đi

**Vị trí:** systems spec §1, §2, §3; acts spec departure/market/sacrifice.

Nhiều nhánh tàn nhẫn nhận vật tư/sức mạnh ngay, còn nhân đạo bị gọi là “mù quáng” và chịu phạt chắc chắn. Nếu chi phí dài hạn chỉ là một ending khác, lựa chọn có thể thành bài toán tối ưu hiển nhiên. Stress tự khóa đường đi hoặc tự hành động cần contract giới hạn để không tước hết quyền điều khiển. Cây siêu phàm, biến dị, 6 kỳ vật, combo, xe chiến đấu, tâm lý và map ẩn cùng lúc cũng tạo tải học rất lớn cho chiến dịch ngắn.

**Cách sửa/xác nhận:** cho hướng nhân đạo lợi ích khác biệt có thật (intel, trợ giúp, năng lực, lối đi); phản đối có cảnh báo và ít nhất một hướng xử lý khác. Thử một ngạch, một kỳ vật và một dilemma trước; đánh giá người chơi có hiểu và cân nhắc được các lựa chọn không.

## Hướng thiết kế đề xuất

### Ngôn ngữ thị giác

- Theo chất **minh họa u tối, kim loại cũ, ánh đèn dầu** của concept. A2 hiện nghiêng ảnh hiện thực hơn; giữ làm nền chuyển tiếp, đánh giá từng asset cần đồng bộ phong cách. Không hứa giữ toàn bộ A2 mà vẫn giống sát concept.
- Màu nền than/xanh dầu; đồng cũ cho khung, vàng cho selection/hành động, đỏ dành nguy hiểm và mất máu, xanh lạnh cho quỷ dị. Giảm các khung trang trí lặp lại; chi tiết cũ tập trung ở cạnh/đầu khung, vùng chữ ít texture.
- Font display có hỗ trợ tiếng Việt dùng cho tên màn và nhãn ngắn; body dễ đọc, đề xuất 16px ở desktop/mobile; không ALL CAPS cho mô tả dài. Không dùng emoji làm bộ icon chính.
- HUD ổn định giữa map/event/scenario/combat. Có vùng thông tin quyết định rõ: mục tiêu, hành động đang chọn, chi phí đã biết, kết quả vừa xảy ra. Không rải cùng dữ liệu ở nhiều panel.

### Bố cục

- **Desktop:** scene làm nền sân khấu theo viewport; HUD tài nguyên/giờ cao khoảng 56–64px; crew rail khoảng 96–128px khi cần; bảng hành động gắn mép dưới/phải, có trần chiều cao và cuộn bên trong khi nhiều chữ. Chừa điểm nhìn cho chuông/xe/địch. Đây là mốc thiết kế thử nghiệm, không số đo đã nghiệm thu.
- **Map là một chế độ riêng.** Event hoặc nhiệm vụ chiếm sân khấu khi đang diễn ra; bản đồ mở qua nút hoặc chế độ điều hướng, không luôn nằm cạnh event. Crew/inventory/journal mở overlay/drawer có điều hướng rõ và focus đúng.
- **Mobile dọc:** không scale nguyên màn 16:9. HUD hai hàng gọn, crew ngang, scene crop có chủ đích, quyết định ở bottom sheet; mục tiêu và CTA chính luôn tiếp cận được, danh sách dài được cuộn. Combat dùng bố cục gọn riêng; landscape là tùy chọn, không bắt buộc để thao tác.
- **Hotspot:** scene con giữ chung hệ tọa độ cho ảnh và overlay hoặc transform cả hai đồng bộ; không `cover` ảnh rồi giữ % hotspot trên hộp khác tỉ lệ. Nhãn va chạm chuyển sang tooltip/list; hotspot có nút semantic/keyboard và danh sách tương đương cho touch.

### Asset còn thiếu

Catalog hiện có 38 mappings/29 ảnh web, trong đó 8 portrait và 2 xe alpha. Không có bộ nhân vật toàn thân chiến đấu, atlas pose, bộ khung kim loại/module trang trí, đủ icon ngạch/kỳ vật mới hoặc scene 3 map ẩn/cabin như concept. 7 JPG concept đã chứa HUD/chữ; không dùng làm nền runtime rồi đặt nút trong suốt lên.

Lập manifest phần thiếu trước khi sản xuất: nhân vật toàn thân hai phe cùng camera/light/scale; chọn một scene combat sạch UI và đúng phối cảnh xe; bộ frame/icon có thể ghép từ CSS/SVG và texture nhỏ. Cây skill nên dựng SVG/data, không vẽ cả cây vào ảnh. Giữ identity các nhân vật và revision A1/A2; chỉ tạo/chỉnh asset được duyệt khi bắt đầu đợt triển khai tương ứng.

### Công nghệ

Khuyến nghị khởi đầu bằng React + CSS/SVG trên client hiện tại: layout, khung, meter, map routes, selection, turn order, drawer đều làm được tại đây. Motion đơn giản dùng CSS/Web Animations; nếu chuỗi combat cần timeline phức tạp thì chọn GSAP làm một hệ điều phối. Không mặc định cài cùng lúc GSAP + Motion + Zustand + Howler + Pixi chỉ vì xuất hiện trong spec.

Pixi là lựa chọn bổ sung cho particles/distortion/parallax khi mẫu thật cho thấy cần; phần text, lựa chọn và điều hướng tiếp tục ở DOM. Pixi có accessibility overlay nhưng phải bật rõ ràng; không tự bảo đảm khả năng truy cập khi chuyển tương tác vào canvas. Nguồn: [Pixi accessibility](https://pixijs.com/8.x/guides/components/accessibility).

Nếu dùng GSAP, timeline phải có lifecycle cleanup và cancel khi load/đổi màn; tài liệu chính thức hỗ trợ `context/revert` và hook React. Nguồn: [GSAP context](https://gsap.com/docs/v3/GSAP/gsap.context%28%29/). Giữ audio Web Audio hiện tại trong slice đầu; quyết định Howler khi có nhu cầu phát file audio thực.

60 FPS là mục tiêu đo trên thiết bị/browser cụ thể, không thể cam kết chỉ từ stack. Có reduced motion và chất lượng thấp; giảm hạt, resolution, blur/filter theo phép đo. Nguồn: [Pixi performance tips](https://pixijs.com/8.x/guides/concepts/performance-tips).

## Lộ trình đề nghị, chưa phải lệnh triển khai

| Đợt | Sản phẩm review được | Điều kiện chuyển bước |
|---|---|---|
| **UX1.0 — Chốt hướng** | Bảng giữ/thay/mới; token/type/icon; kiểm kê asset; mẫu bố cục event bệnh viện, combat, map và mobile. Chốt độ bám phong cách minh họa. | Người dùng đánh giá được hình thức và thao tác dự kiến; tách rõ phần thật/phần chưa có. |
| **UX1.1 — Một slice thật** | Shell mới + event bệnh viện hoặc hiện trường Chợ mất điện đang có, crew rail, quyết định và phản hồi thực; không thêm hệ siêu phàm. Chọn bệnh viện làm mẫu thị giác, chợ làm bài kiểm tra nhiều hotspot. | Hành động dispatch command thật; desktop/mobile đọc và thao tác được; layout gần concept, không còn dashboard chiếm đầu màn. |
| **UX1.2 — Combat** | Sân khấu hai phe, asset toàn thân được chọn, turn ribbon, skill deck, preview, sequencer đa phản công và HP giữ identity. | Phân biệt attacker/target/damage/heal, skip/reduced motion, không double command; hậu chiến/bắt giữ/rút lui vẫn đủ. |
| **UX1.3 — Map và quản lý** | Map rộng, intel radar, travel transition, convoy/inventory/journal thống nhất; save/load/menu/ending. | Không lộ facts, không mất tính năng; crop/hotspot đúng và fallback đầy đủ. |
| **Gameplay slice tiếp theo** | Một quy tắc động bệnh viện + sổ manh mối + một kỳ vật chủ động, rồi mới xét pathway/map ẩn/ethos. | Truth table, content/version/legacy và ngân sách khả thi; đánh giá chơi thật trước nhân rộng. |

Trước mỗi đợt code đáng kể phải có plan riêng trong `docs/plans/` theo WORKFLOW. Review này chưa phê duyệt toàn bộ 5 pha R2 hoặc việc cài dependencies/sản xuất ảnh.

## Acceptance đề xuất khi bắt đầu triển khai

- So ảnh thật với concept ở 1280×720, 1920×1080 và 390×844; ghi rõ state/seed/browser/diff. Kiểm tra thêm text tiếng Việt dài và roster 4 người, không chỉ cảnh đẹp ít dữ liệu.
- Desktop không phải cuộn trang để tìm hành động chính. Mobile không tràn ngang, không cắt CTA/nhãn quan trọng; vùng chạm đề xuất tối thiểu 44px và nội dung dài có đường cuộn rõ.
- Không dùng chỉ màu để báo chọn/khóa/nguy hiểm; hỗ trợ focus, keyboard, reduced motion. Screen reader vẫn có tên nút và trạng thái cần thiết.
- Art lỗi vẫn chơi được, gồm cả `<img>` trực tiếp của R4 hiện chưa đi qua `AssetArt`; shader/WebGL lỗi không chặn command.
- UI-only giữ accepted-command semantics, RNG/log và save/replay. Khi được triển khai, chạy checks phù hợp rồi browser thử đường chính, combat/aftermath, scenario/crisis/debrief, load/menu giữa animation. Không coi ảnh đúng tên hoặc test pass là bằng chứng visual QA.

**Bước đầu tiên khi người dùng yêu cầu làm lại:** viết plan UX1 trên baseline hiện tại, chốt manifest asset thiếu và dựng một màn event/scene thật kèm mobile để review; không bắt đầu bằng việc sửa toàn bộ core theo plan R2 nhập vào.

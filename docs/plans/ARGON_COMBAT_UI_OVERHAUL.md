# Đại tu combat và UI theo hướng Argon

**Ngày:** 2026-10-29. **Baseline:** HEAD `6955279`, R4.1. **Trạng thái:** O0/O1 đã tích hợp và qua technical gates; chờ duyệt hình/nhạc/human playtest. O2–O4 chưa hoàn tất. Xem [báo cáo triển khai](../reports/ARGON_O1_IMPLEMENTATION.md). Các mô tả hiện trạng dưới đây ghi theo baseline trước triển khai.

## Checkpoint thực thi O0/O1 — bắt đầu 2026-10-29

Người dùng đã yêu cầu **“bắt đầu triển khai đi”**. Được triển khai code/art và chạy kiểm chứng cần thiết cho đợt này. Những giới hạn “chỉ lập phương án/chưa chạy QA” ở các checkpoint phía dưới là lịch sử, không còn là lệnh hiện tại.

Contract đầu tiên: bundle mới `0.2.0-campaign.1-argon`, state/save giữ v3 với combat fields optional chỉ xuất hiện ở bundle mới; R1/R4 `.5-r1` và `.4` giữ resolver hiện tại. Hành động khởi phát encounter trả 1 giờ/khẩu phần một lần; các lượt và hậu chiến trong trận trả 0 giờ, cooldown đếm bằng lượt của actor. Scenario-crisis mở trận trả 1 giờ riêng; không thu lại phí vào trận khi đánh hoặc rút. World clock/NPC chỉ tiến theo thời gian thật của command.

Combat O1: 4 slot mỗi phe, slot 0–1 là hàng trước; slot 2–3 hàng sau. Nếu hàng trước không còn người active, hàng sau thành tuyến đầu có thể nhắm. Đánh cận chiến chỉ từ tuyến đầu và nhắm tuyến đầu; skill ranged có thể xuyên hàng. Đổi chỗ là một action, chỉ swap người active cùng phe; chuyển vào slot trống hợp lệ. Trạng thái tick tại đầu lượt người mang, trạng thái mới kéo dài qua ít nhất lượt kế của người mang. Mỗi actor một action; hỗ trợ xe tối đa một lần mỗi vòng, vẫn tiêu action/cost. Ending/capture/loot giữ quyền sở hữu thật.

Checkpoint: [x] schema/content/registry/compatibility; [x] resolver/read models/14 behavior tests; [x] shell/stage/sequencer; [x] atlas/bối cảnh/prompts/manifest; [x] nhạc combat/SFX/ambience tích hợp; [x] technical checks/browser QA; [ ] duyệt hình/mix/human playtest O1; [ ] O2–O4. Không coi technical pass là media acceptance cuối.

## 1. Yêu cầu và mục tiêu

Sau review bộ `docs 2/`, người dùng muốn loại bỏ UI cũ và thay bằng hệ thống chiến đấu mới + giao diện mới hoàn toàn theo hướng Argon. Vì vậy, phương án UI-only UX1 trong [review trước](../reports/CONCEPT_REDESIGN_REVIEW.md) không còn là phạm vi đích đề nghị. Mục tiêu mới là một trải nghiệm đồng bộ về luật chiến đấu, hình ảnh, tương tác và phản hồi hành động.

Tài liệu này cụ thể hóa lựa chọn đó để thảo luận và làm cơ sở triển khai tiếp theo. Các quyết định chi tiết bên dưới là đề xuất của agent, không được ghi nhận như yêu cầu đã được người dùng xác nhận từng mục. Câu hỏi hiện tại không được dùng để tự chạy toàn bộ 5 pha R2 nhập vào hoặc sản xuất ảnh hàng loạt.

Đích giao hàng:

- Frontend mới thay thế shell/dashboard và các màn map/event/combat/crew/inventory/journal/menu/ending hiện có; không để UI cũ tồn tại như đường chơi chính khi nghiệm thu.
- Combat mới có luật riêng thực sự: đội hình, targeting, trạng thái có vòng đời, phối hợp kỹ năng, kỳ vật chủ động và hỗ trợ xe. Animation thể hiện kết quả engine thật.
- Hướng mỹ thuật theo 7 concept, đặc biệt 01/02/03; hoàn thiện đủ asset để cảnh chiến đấu gần concept 02, không nghiệm thu bằng chân dung/cards thay cho nhân vật toàn thân.
- Tiếp tục dùng nền core thuần, `processCommand`, deterministic RNG, registry content, facts/knowledge, ownership và persistence. Module chiến đấu được thay cho hành trình mới; luật cũ tồn tại ở nhánh compatibility khi cần tải/replay save cũ.

## 2. Hiện trạng và các phần phải thay

`src/combat/state.ts` hiện giữ turn order, round, danh sách defend/vulnerable/panicked/bleeding và last enemy action; chưa có vị trí/targeting theo hàng hoặc một hệ status tổng quát. `src/combat/engine.ts` xen kẽ hai phe, địch chủ yếu chọn người active thấp máu, đánh xe bằng giảm condition trực tiếp. Combat/skill hiện tiêu tick thế giới qua processor.

`src/client/App.tsx` dựng nhiều tầng dashboard; `CombatPanel.tsx` dùng fighter cards và đọc delta từ command cuối. CSS và component hiện tại không phải bộ khung đích. Read models và `AssetArt` có thể tái dùng phần phù hợp nhưng cần kiểm tra API, fallback và accessibility.

`loadCompatibleSlot` hiện chỉ phân biệt legacy `.4` và campaign hiện tại bằng hai nhóm slot. Thay toàn bộ combat đòi mở rộng registry/version routing; lưu thêm một file content archive không tự bảo toàn resolver cũ. Không ghi đè `.5-r1` bằng luật mới.

## 3. Thiết kế combat đề nghị

### Đội hình và hành động

- Sân khấu ngang hai phe, mỗi phe tối đa 4 vị trí, chia hàng trước/sau. Roster ít người vẫn hợp lệ; vị trí là state có hiệu lực lên targeting/skill, không chỉ tọa độ vẽ.
- Mỗi actor có một hành động chính khi đến lượt: đánh, skill, guard hoặc đổi vị trí. Kỳ vật combat tiêu action theo definition, có cooldown/charge/cost; không mặc định kích hoạt miễn phí vô hạn.
- Skill khai báo hàng được phép dùng/nhắm, nhóm mục tiêu, cost, cooldown và operators. Chốt quy tắc bù vị trí khi người gục, swap với người gục và target không còn hợp lệ trước khi code.
- Giữ turn ribbon; enemy intents được tính bằng read model dùng cùng policy/formula với resolver, có phân biệt dự kiến và chắc chắn. Không đoán sát thương hoặc mục tiêu trong React.
- Đề xuất ban đầu dùng mô hình vị trí/hàng; chưa thêm bàn cờ ô vuông và di chuyển tự do vì không cần để đạt sân khấu concept 02. Quyết định này cần được chốt trong combat contract trước triển khai.

### Combo, nhân vật và xe

- Status là dữ liệu với source/target, potency, duration, thời điểm tick và quy tắc cộng dồn; ưu tiên bleed, armor break, daze, ward. Reflection/link có chặn recursion và giới hạn trigger.
- Chuỗi phối hợp đầu tiên: phá giáp → đòn khai thác điểm yếu; khâu chữa bleed; guard bảo vệ hàng sau. Sau khi vòng này chơi được mới mở các hiệu ứng đảo sát thương/phản chiếu phức tạp.
- Đích progression theo Argon gồm 4 ngạch siêu phàm, cấp bậc và chuyển chức lai; chốt bảng chi phí/cặp lai trước, không copy các con số còn mâu thuẫn trong `docs 2`.
- Xe là đối tượng có vai trò chiến đấu rõ, có health/condition thật và skill hỗ trợ giới hạn theo vòng. Target/cover/cost/failure được khai báo; không chỉ đặt sprite sau đội hình.
- Giữ các hướng kết thúc: thắng, thua, rút lui, đàm phán/đầu hàng theo encounter, bắt giữ và hậu chiến. Mục tiêu mở rộng có thể gồm giữ xe/rút được người, không bắt mọi trận phải giết hết địch.

### Thời gian và sinh tồn

Đề nghị tách combat turn/round khỏi world tick. Cooldown/status chiến đấu dùng lượt/vòng, không dùng giờ hành trình. Một encounter có chi phí thời gian thế giới theo definition, phương án khởi đầu là thu một lần khi vào trận; không thu lại sau từng đòn và không hoàn phí khi rút lui. Thời điểm NPC xử lý clock, supplies, terminal và phần thưởng phải được chốt thành transition contract; đây chưa phải luật đã triển khai.

Đối chiếu ảnh hưởng tới scenario/crisis, nhiều phase trong cùng trận, cứu người, food/water và rival race trước khi hạ tài nguyên theo đề xuất Argon. Legacy vẫn giữ tick/command semantics cũ. Không dùng tỷ lệ bot thắng 55–70% làm tiêu chí duy nhất cho chất lượng.

## 4. UI và asset mới

Phạm vi media chi tiết: [ARGON_MEDIA_PLAN](../assets/ARGON_MEDIA_PLAN.md). Đề xuất ảnh, animation, SFX, ambience và nhạc là phần của đợt đại tu, có gate ngay O1. Voice chọn lọc/clip có điều kiện nguồn sản xuất; chưa có file hoặc quyền gọi dịch vụ chỉ vì đã lập plan.

- Scene viewport làm nền chính, HUD gọn, crew rail/turn ribbon và action deck theo ngữ cảnh. Map, sự kiện, nhiệm vụ và combat là các chế độ rõ; quản lý mở overlay/drawer hoặc màn chuyên dụng cùng ngôn ngữ mỹ thuật.
- Cảnh nền không chứa chữ/nút/status. Text tiếng Việt, preview, target selection, focus và thao tác touch dựng thật; mobile có bố cục riêng, không scale nguyên concept 16:9.
- Chuỗi trình diễn phát theo domain events có đủ attacker/target/amount/status và thứ tự. Engine/state/autosave cập nhật ngay khi command được chấp nhận; presentation có thể phát sau, skip, cancel hoặc reduced motion mà không thay rules.
- Chốt spec layers/texture/camera/lighting trước gen: portrait nhận diện, full-body hai phe, xe đúng phối cảnh, nền sạch UI, skill/artifact icons và vật liệu khung. Mỗi asset có manifest/prompt/revision/receipt; chỉ gen phần thiếu hoặc cần đổi phong cách có lý do.
- A1/A2 master được bảo toàn. Chọn từng asset tái dùng/chỉnh/thay; không ép giữ asset lệch phong cách khi mục tiêu là sát concept, cũng không generate lại cả catalog mặc định.
- Chọn renderer sau mẫu kỹ thuật nhỏ: React/DOM cho HUD/text/control; CSS/SVG cho phần phù hợp; Pixi cho stage/effects nếu có ích, một timeline điều phối. Không xem cài đủ 5 thư viện là dấu hiệu hoàn thành redesign.

## 5. Kiến trúc và compatibility

Các vùng chính cần sửa/thêm khi triển khai: `src/combat/`, `src/core/{commands,events,processor,state-schema}.ts`, `src/content/`, `src/read-models/`, `src/persistence/`, `src/scenario/` và frontend `src/client/`. Đường dẫn module mới cụ thể sẽ được chốt sau contract, tránh tạo tên file giả như đã tồn tại.

1. Chụp baseline content + luật R4.1 trước khi thay resolver; lưu fixture có command scenario thật, không chỉ fixture trước R4.
2. Chốt engine/content/save version và slot mới dựa thay đổi thực tế; chưa tăng version chỉ vì viết plan hoặc đổi hình.
3. Bundle mới chọn combat resolver mới; bundle cũ chọn luật cũ. RNG draw, status normalization và initialization không làm đổi replay cũ.
4. UI mới dùng read model thích hợp cho cả hai ruleset. Save cũ không tự có pathway hoặc đội hình mới; nếu mở trận legacy thì hiển thị bằng UI mới theo khả năng thật của luật cũ.
5. Không tự chuyển hành trình cũ giữa chừng sang combat mới. Chuyến mới dùng bản mới; legacy mở có nhãn rõ. Chỉ xóa component/CSS cũ sau khi UI mới đã thay đủ đường chức năng và kiểm chứng.

## 6. Các đợt thực hiện

| Đợt | Sản phẩm cụ thể | Gate trước bước kế |
|---|---|---|
| **O0 — Contract và hướng hình** | Sửa mâu thuẫn Argon; combat/time/status/targeting contract; compatibility matrix; asset manifest; layout desktop/mobile. | Dữ liệu/rules/ảnh phân biệt rõ; có truth table và phương án cho failure/retreat. |
| **O1 — Trận mẫu mới hoàn chỉnh** | Combat resolver mới, hai phe có đội hình, một combo/skill hỗ trợ/kỳ vật, xe có tác dụng; stage mới cùng asset chuẩn; animation/SFX theo beat, ambience và nhạc combat; thắng/thua/hậu chiến. | Chơi được từ đầu tới kết thúc, save/replay đúng; đạt layout concept trên desktop/mobile và nghe mix thật. Asset/âm tạm không được coi là media acceptance cuối. |
| **O2 — Thay frontend còn lại** | Menu, map, event, scenario, quản lý, journal, save/load, ending bằng shell mới. | Không mất thao tác, intel đúng, image fallback; mọi đường chơi chính thoát được; UI/CSS cũ không còn được route tới. |
| **O3 — Hoàn thiện combat/progression** | Đủ ngạch/kỳ vật/AI/encounter theo phạm vi đã chốt; tích hợp campaign và ngân sách mới. | Combo/action economy/cooldown/targeting không exploit; fixtures legacy/R4 và nhánh campaign đạt. |
| **O4 — Content mở rộng và giao hàng** | Rule động, map ẩn, dilemma/ethos/hi sinh theo từng slice đã sửa spec; đồng bộ art/audio; tài liệu và release. | Kiểm tra reachable/softlock, human playtest, visual/performance/mobile; không công bố số lượng content chưa có. |

O1 là một phần của hệ thống đích và sẽ phát triển tiếp, không phải bản reskin giữ combat cũ. Lộ trình không yêu cầu xây hết mọi hệ mới trước khi nhìn thấy UI và trận đánh mới.

## 7. Kiểm chứng và rủi ro

Khi bắt đầu implementation, kiểm tra command bị từ chối bất biến, vị trí/target hợp lệ, vòng đời status/cooldown, bounds resources/health, phản/link không lặp, death/retreat/aftermath, thời gian NPC và atomic save/replay. Giữ genuine fixtures các thế hệ; thêm kịch bản R4→combat→scenario tiếp tục. UI cần thử chọn skill/target, double click, multi-hit, skip/load/menu giữa animation và lỗi ảnh/WebGL.

Visual gate dùng concept làm reference ở 1280×720, 1920×1080 và 390×844, gồm roster đông/text tiếng Việt dài. Kiểm tra không tràn ngang, không cắt CTA, mobile touch/focus/reduced motion, identity nhân vật và phối cảnh. Đo hiệu năng trên môi trường ghi rõ; 60 FPS là mục tiêu chưa được chứng minh.

Rủi ro lớn: asset không đồng bộ, animation kể sai transaction, hàng trước bị mất làm hết target hợp lệ, control-lock/reflect tạo vòng vô hạn, thay tick phá economy/rival clock, routing legacy thiếu R4 semantics và phạm vi siêu phàm/content quá rộng. Giải quyết bằng contract, một trận thật và từng gate, không bằng generate hàng loạt hoặc viết lại toàn bộ trong một lần.

## 8. Checkpoint phiên lập phương án

Đã đọc source combat/state/persistence và tài liệu Argon, đối chiếu Git với review trước. Chỉ bổ sung plan và cập nhật docs; chưa sửa gameplay/UI, chưa gen, chưa test/build/validator/simulation/browser QA. Có một lần đọc nhầm đường `src/combat/schema.ts` không tồn tại; đã liệt kê thư mục và đọc đúng `src/combat/state.ts`. Không có gate runtime mới.

**Bước tiếp theo khi bắt đầu triển khai:** O0, cụ thể hóa combat/time contract và manifest asset trên baseline hiện tại, rồi thực hiện O1. Không quay lại mặc định UX1 UI-only.

## 9. Phủ toàn bộ yêu cầu Argon

Về kỹ thuật, các nhóm yêu cầu không có trở ngại kiến trúc đã xác định khiến phải loại bỏ. Tuy nhiên, chưa sẵn sàng triển khai nguyên văn toàn bộ: phải sửa các mâu thuẫn đã ghi trong review, hoàn thiện registry/rules và xác định nguồn media. Không đồng nhất “khả thi” với “đã làm”, “đủ asset” hoặc “đã chứng minh cân bằng/hiệu năng”.

| Nhóm Argon | Đích của đợt đại tu | Điều kiện cần giải quyết |
|---|---|---|
| Scene-first cho đủ 7 concept, responsive và hiệu ứng | Có trong đích; renderer phụ trợ được cân nhắc theo full shader, không mặc định chỉ CSS | Layout/thao tác theo dữ liệu thật, asset/motion brief, thử GPU/mobile |
| Combat synergy/status/xe | Có, triển khai từ O1 rồi mở rộng O3 | Targeting/turn/status contract, tách giờ hành trình, AI/preview/animation thống nhất |
| 4 ngạch Bậc 9→7, chuyển chức lai | Có trong đích O3 | State machine, XP/remnant/cost, chốt 4 cặp lai đề xuất và hành vi 2 cặp chưa đặc tả |
| 6 kỳ vật chủ động và resonance | Có trong đích O3 | Ownership, cooldown/action economy, phản/link không lặp, giá/bounds và effects dùng ngoài combat |
| Stress/corruption/ethos/veto | Có trong đích O3/O4 theo slice | Tránh khóa mọi lựa chọn, chỉ rõ ai/giá trị nào dùng xét ending, phản ứng deterministic và có cảnh báo |
| Rule động theo seed, sổ manh mối, dò quy tắc | Có trong đích O4 | Truth table đủ action đúng cho mỗi tín hiệu; knowledge khác world facts; giữ RNG/replay legacy |
| Map ẩn/route encounter/content/endings | Có trong đích O4 | Chốt topology; bảng hiện có 12 location/15 event so với mục tiêu ghi 11/24; bổ sung hoặc sửa scope công khai; 8 ending cần reachability và ưu tiên |
| Hi sinh/captive/di sản | Có trong đích O4 | Actor lifecycle, ownership/supplies, đường thay thế, hậu quả/confirm và nhánh terminal |
| Radar/rival/economy | Có trong đích O2/O3/O4 | Intel đúng mức biết, ETA không hardcode, tính lại ngân sách sau combat time mới |
| Save/replay/validators/tests/simulation/QA | Bắt buộc khi implementation | Legacy và R4 fixtures, test hành vi, simulation có báo softlock, human playtest và bằng chứng visual/audio thật |
| Audio/music/voice/video | Art/motion/SFX/ambience/nhạc trong gói cơ sở; voice/clip theo điều kiện media plan | Hiện chỉ có audio tổng hợp; cần nguồn thu/sản xuất cho chất lượng cuối, không có tool audio/video chuyên dụng trong phiên |

Yêu cầu cài chính xác Pixi/GSAP/Motion/Zustand/Howler trong bản Argon được coi là đề xuất implementation cần đánh giá, không phải tính năng sản phẩm phải có đủ năm package. Với full filters, phương án đề nghị là React HUD + Pixi effects/stage + một sequencer; chưa cài dependencies trong phiên lập phương án.

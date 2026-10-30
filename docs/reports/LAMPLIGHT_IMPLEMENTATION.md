# Lamplight — bản thử khám phá trực tiếp Thánh An

30/10/2026. Thực hiện theo yêu cầu “ok thực hiện đi”, trên baseline `f792071` và [plan](../plans/LAMPLIGHT_FIELD_EXPLORATION.md). Giữ lớp chiến lược, combat, lore và siêu phàm; thêm một khu nhỏ để kiểm chứng hướng khám phá. Không mở chiến dịch sau Bắc Sơn.

## Chức năng thật

- Phòng trực Thánh An gồm ba phòng, hai cửa, vùng đèn cố định, đèn pin 24 đơn vị, một bóng theo quy tắc và ba vật có thể thu thập. Chọn một thành viên còn hoạt động; WASD/mũi tên hoặc nút chạm di chuyển, Shift/nút chạy đi hai ô, E tương tác, F bật/tắt đèn, Esc tạm dừng. Có chuột để bước vào ô kề/tương tác vật trong tầm.
- Khám phá **theo nhịp hành động**. Đứng yên dừng simulation; không phải truy đuổi realtime. Lưới nguyên/collision/cửa/LOS là authority, client nội suy chuyển động. Cửa đóng chặn cả người và bóng; không thể đóng khi một bên đứng trên ngưỡng. Ánh sáng giữ bóng đứng yên, tiếng động trong tối gọi nó tiến theo đường đi hợp lệ. Va vào bóng gây mất HP, rơi một món nếu có và đẩy người về cửa ra.
- Quan sát bóng thực sự tiến trong tối rồi dừng dưới đèn mới ghi quy tắc. Chỉ có tiếng gõ khi cửa đang chặn đường, không báo sai “đang tới gần”. Tủ thuốc cho 3 thuốc; sổ giao ca mở hồ sơ thứ bảy và di vật; hộp bảo trì cho 3 xăng/2 phế liệu. Túi chỉ có hai chỗ, phần thưởng về kho khi trở lại cửa ra.
- Một lượt xuất kích/site; cả return sớm và rescue đều khép lại lượt. Entry trả 2 giờ và khẩu phần của toàn bộ người còn sống, yêu cầu còn một giờ dự trữ. Microaction/return không trả thêm giờ thế giới. Rescue bỏ cargo, trừ 4 HP người xuất kích và 8 độ bền xe; hết 96 nhịp tự cứu hộ. Bỏ qua/thất bại không khóa tuyến bệnh viện cũ.
- Stage SVG, bóng/đèn/props vector và cue Web Audio dùng hạ tầng hiện có. Mobile có camera gần và nút điều khiển cố định; pause/ẩn trang chặn input, modal cứu hộ làm nền inert. Không thêm framework, ảnh AI, clip hoặc tiêu Google credits. Flow opening/travel cũ giữ nguyên.

## Scenario và cân bằng

Bundle mới dùng Scenario resolver theo dữ liệu role/cost/effect/cargo: kiểm tra scenarioID/location, hai scout và guard khác nhau/còn hoạt động, đúng vai trò; trừ chi phí nguyên tử; thu khẩu phần/thời gian một lần lúc vào. Không thể lặp finish để lấy hàng hoặc đổi module lần hai. UI đọc config mới, hiện chi phí đấu dây và vai trò thật. Sức chứa tính theo số cargo effects, không chỉ kiểm tra có effect hay không.

Resources khởi đầu 84 food / 90 water / 28 fuel thay cho 96 / 108 / 34. Hai kẻ giữ kho Tro Tàn có 64/52 HP và 12/11 công. Cấu hình tactical mới thêm guard mở đầu cho người đứng đầu, đòn nhắm xe có báo trước mỗi hai activation của đối thủ tầm xa và sát thương xe tối thiểu 8 cộng roll. AUTO/retreat/đàm phán vẫn còn. Các số này chưa chứng minh độ khó hay độ cuốn qua người chơi.

Audit sáu seed 0–5 trên mỗi policy, cùng bot và tuyến; trung vị tài nguyên lúc kết thúc, Resonance → Lamplight:

| Policy | Food | Water | Fuel |
|---|---:|---:|---:|
| peaceful | 32 → 20 | 67 → 49 | 11 → 5 |
| combat | 56 → 44 | 96 → 78 | 26 → 19 |
| trade | 32 → 20 | 67 → 49 | 17 → 11 |
| surrender | 32 → 20 | 67 → 49 | 11 → 5 |
| fallback | 39 → 27 | 54 → 36 | 20 → 14 |
| ruthless | 66 → 54 | 104 → 86 | 27 → 20 |

Các bot này chưa chơi Scenario/fieldwork và không dùng nghi thức siêu phàm, nên chỉ audit đường nền. Còn dư food/water đáng kể; bot combat cũng không cho bằng chứng địch mới đủ khó. Giữ đợt giảm vừa phải, không cắt sâu thêm trước human playtest.

## Version, source và compatibility

New game `0.4.0-campaign.1-lamplight`, slots `lamplight-*`. Giữ nút tải Resonance/Journey/O1/R1/.4, không migrate ngầm. State/save v3 thêm optional fieldwork, engine0.1.0. New commands: field-enter, field-step, field-interact, field-exit; domain event field.event. Registry/validator nhận bundle mới. Trạng thái field lưu cả vị trí/bóng/cửa/pin/túi/nhịp/knowledge/hoàn tất và replay xác minh bằng commands.

Source chính:

- `src/fieldwork/{schema,geometry,engine}.ts`, `src/content/lamplight.ts`.
- Core commands/state/invariants/processor, narrative schema/validation.
- `src/scenario/field-engine.ts` và wrapper chọn resolver; `legacy-engine.ts` giữ nguyên byte source trước đợt này. SHA256 cả bản gốc `f792071:src/scenario/engine.ts` và legacy file: `3eaf86fed1989b95eafee021b2075533f1d39157a6eb84b2b149a7828d4a68b5`.
- `src/client/argon/ExplorationScreen.tsx`, `exploration.css`, SceneScreen/App/use-game/audio và ScenarioScene.
- `tests/fieldwork.test.ts`, `scripts/audit-lamplight.ts`; CLI campaign/simulation nhận `--content lamplight`.

Legacy Scenario giữ cả semantics/lỗi lịch sử để replay save cũ; chỉ bundle mới nhận luật sửa. Hiện vẫn có một state Scenario cho cả campaign, chưa hỗ trợ nhiều Scenario nối tiếp chỉ bằng cách thêm registry entries.

## Kiểm chứng

Rà soát cuối đã sửa hai lỗi reservation: kiểm tra buffer lặp sau khi đã trừ khẩu phần, và tactical Scenario entry còn tính thêm một giờ; regression tests xác nhận cả hai.

Runtime gate Node **24.14.0**. Diff bao gồm source mới phía trên; log chính [lamplight-check.txt](../../artifacts/lamplight-check.txt). Implementation **`18d770e` đã commit/push origin/main**, SHA remote đã đối chiếu đúng; cập nhật bàn giao Git ở commit docs tiếp.

| Lệnh | Kết quả thật |
|---|---|
| `npm run check` | 167/169 tests, 10 files; world/content/art validators, strict TypeScript, production build pass. Vitest 7.68s; Vite 5.84s. Có warning annotation Zod và chunk >500KB, không phải build failure. |
| `npm run simulate:campaign -- --content lamplight --seeds 6 --output artifacts/lamplight-simulation.json` | 48 runs: 36 thắng, 12 thua starvation/lethal hazard chủ đích; 0 softlock/rejected, 48 save/load/replay. Không ghi riêng wall duration. |
| `npx tsx scripts/audit-lamplight.ts` | 72 đường nền old/new để audit kinh tế; 80 field actions/93 total commands đo dispatch, serialize full replay và load. Node24: dispatch median 3.90ms / p95 6.70ms; serialize median 190.73ms / p95 317.49ms; load 280.34ms. Một lần audit lỡ dùng Node23 đã bị thay bằng lần Node24 cuối; không dùng số đo Node23 làm gate. Runtime/số đo trong artifact. |
| So sánh SHA256 resolver cũ và `git diff --check` | Resolver khớp byte; không có lỗi whitespace. |

23 test mới phủ atomic reject/ownership/entry buffer, living crew gồm captured passenger, tường/cửa/chạy/pin, noise/ánh sáng/bóng bị cửa chặn, phát hiện quy tắc, sức chứa/loot/reward một lần, return/rescue/timeout, save/replay giữa phòng và sau thoát. Có tuyến **toàn command thật** lấy thuốc + sổ, tránh bóng đang đứng, đóng cửa và mang cả hai về không bị đánh. Validator chặn điểm không nối được/start nằm trong cửa đóng. Scenario tests chặn scout trùng, role/cost sai và finish lặp; tactical kiểm tra guard/intent theo version. Một số unit tests dựng state cho rìa hiếm; chúng không được tính là integration replay.

Performance: serialize luôn xác minh lại toàn replay, nên chậm hơn một bước engine đáng kể. Field autosave đã debounce **650ms sau thao tác cuối**, flush trên return/rescue/save/menu/load/pagehide/ẩn trang. Không bỏ invariant/replay để làm nhanh. Xem [audit JSON](../../artifacts/lamplight-audit.json) cho p50/p95/max và runtime chính xác; đây là số đo Node, không phải FPS/browser frame time. Crash hoặc đóng cưỡng bức trong khoảng chờ có thể mất bước cuối.

Browser QA dùng origin **5181 riêng**, không ghi save người dùng ở5180. Đã thao tác UI desktop1280×720 và mobile390×844:

- Chọn Lan từ entry bệnh viện: 80 HP thật; giờ15→17, food60→54, water69→63.
- WASD và nút hướng, cửa chặn lối, pin giảm từng bước, tạm dừng chặn input.
- Lưu giữa ngưỡng cửa: tải lại đúng beat5/pin19 và cửa mở; lưu khi túi có thuốc rồi tải khớp.
- Mang thuốc về: thuốc8→11, giờ vẫn17, navigation chiến lược mở lại. Cứu hộ từ checkpoint có thuốc: thuốc vẫn8, Minh100→96, xe100→92.
- Mở cửa trong tối: bóng tiến/cue kéo lê; bật đèn và bước tiếp: bóng đứng, rule được ghi. Menu ngay sau bước rồi tiếp tục giữ beat16/pin21, xác nhận flush autosave.
- Mobile controls đều nằm trong viewport; scrollWidth375 ≤ viewport390. Không có console warn/error trong kiểm tra field/Scenario cuối. UI Scenario hiển thị đúng “Đã có Thợ máy” và 1 phế liệu khi đấu dây.

Ảnh [desktop](../../artifacts/lamplight-desktop.jpg), [mobile](../../artifacts/lamplight-mobile.jpg); [simulation](../../artifacts/lamplight-simulation.json).

## Cách thử và phần chưa làm

Dev chính `http://127.0.0.1:5180/`: bắt đầu hành trình mới, tới bệnh viện và xác minh quy tắc, chọn **Vào phòng trực**. Dev QA riêng `http://127.0.0.1:5181/?qa=explore` tới thẳng khu; `?qa=hospital` thử entry. QA preset chỉ có ở DEV và dựng trạng thái bằng command, không có trong production.

Đây là một prototype nhỏ với hình vector và animation nội suy. Chưa có realtime AI/physics/procgen, sprite animation nhiều hướng, skill siêu phàm trong khám phá, chapter cinematic mới, climax hay màn sau Bắc Sơn. Luật siêu phàm trong combat từ Resonance vẫn giữ. Chưa thử điện thoại thật, reduced-motion cấp hệ điều hành, nghe duyệt mix hoặc human playtest độ hấp dẫn/thời lượng. Bước tiếp là chơi thử một lượt, đánh giá điều khiển/độ rõ quy tắc/áp lực pin và quyết định mở rộng; không tự nhân rộng các khu chỉ vì test pass.


## Phản hồi người chơi: hoàn tất khoảng 5 phút — 30/10/2026

Người dùng báo có thể chơi xong game trong 5 phút. Đây là thời lượng tự báo của một lượt, chưa có accepted-command log/tuyến cụ thể hoặc phép đo tại máy của agent. Tuy vậy source hiện tại giải thích được vấn đề cấu trúc; không có căn cứ báo đã đạt mục tiêu 20–30/65–90 phút trong R4.

- `src/read-models/campaign.ts`: chương và objectives là read model từ visits/facts/knowledge, chưa phải chuỗi màn nhiều giai đoạn. Nhãn ba chương không đồng nghĩa ba hồi có lượng gameplay tương ứng.
- `src/content/campaign.ts:193`: tới checkpoint chủ yếu cần hospital.resolved, tới refuge cần rival.resolved. Nhiều lựa chọn hiện giải quyết vấn đề bằng một command; lore/Scenario/fieldwork và thức tỉnh không phải tất cả đều cần để hoàn tất tuyến.
- `src/core/processor.ts:349`: tới goal tại Bắc Sơn là chốt won ngay. Chưa có thử thách tại nơi trú/cao trào kết nối những điều đã học.
- Lamplight thêm một site ba phòng tùy chọn và sửa nền, chưa thay cấu trúc campaign. Giảm vật tư, tăng HP hay thêm clip không đủ xử lý lượng việc chơi quá ít.

Hướng đợt tiếp theo được đề nghị: trở lại mục tiêu R4 là **một chặng đầu hoàn chỉnh 20–30 phút chơi tích cực**, rồi mới mở rộng toàn chiến dịch 65–90 phút. Đây là mục tiêu playtest, không phải thời lượng đã đạt hoặc cam kết đoán từ số event. Chưa triển khai các mục dưới đây và chưa tự mở scope sau Bắc Sơn:

1. Một vấn đề chính có nhiều giai đoạn: phát hiện trở ngại → đi lấy thông tin/vật cần thiết → thử phương án → chịu phản ứng → giải quyết/thoát. Facts/contracts và trạng thái nhiệm vụ thật quyết định tiến độ.
2. Chợ/trạm dịch vụ là các nhiệm vụ có mục tiêu khác nhau, nối hậu quả trở lại xe; không nhân bản phòng loot hoặc bắt đi lòng vòng để đủ phút.
3. Đường tránh vẫn hợp lệ nhưng là nhiệm vụ thay thế có hành động và đánh đổi, thay vì một nút giải xong cả hồi. Không ép người thích đàm phán phải đánh mọi trận.
4. Giới thiệu cơ hội thức tỉnh sớm, cho skill đã chọn có tác dụng trong điều tra/khám phá lẫn combat; luôn có cách tiếp cận bằng công cụ/vật tư. Không yêu cầu mở đủ mọi con đường để đi tiếp.
5. Sau khi scope được mở rộng, Bắc Sơn cần mục tiêu/cao trào thật trước ending; lore thu thập trước đó phải giúp quyết định và tạo khác biệt ở hậu quả.

Tiêu chí tiếp nhận: chơi người thật từ new game, ghi tuyến/số lần thử/nội dung bỏ qua; đánh giá một người biết đường và một người mới. Không dùng chờ bắt buộc, phim không skip, tăng HP đồng loạt hoặc dài văn bản để đạt số phút. Phiên tiếp nhận phản hồi này chỉ đọc source và cập nhật tài liệu; không sửa gameplay/chạy gate/browser QA/sản xuất media.

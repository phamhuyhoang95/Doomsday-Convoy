# Lamplight — lớp khám phá trực tiếp Thánh An

30/10/2026; baseline `f792071`. Người dùng đã yêu cầu “ok thực hiện đi” sau review PLAYER_FEEDBACK_AND_2D_REVIEW. Được triển khai code/UI và QA cho slice này. Giữ chiến lược/combat; không mở chiến dịch sau Bắc Sơn hoặc nhân rộng mọi địa điểm trong đợt này.

## Phạm vi

1. Bundle mới `0.4.0-campaign.1-lamplight`, slots lamplight-*; giữ nguyên Resonance/Journey/O1/R1/.4. State/save v3 additive, engine0.1.0. Save cũ chọn đúng definition/legacy resolver.
2. Scenario mới sửa finish nhận thưởng lặp, scout trùng, scenarioID/location/role/cost; trả khẩu phần theo số người và thời gian **một lần lúc vào**. Giữ resolver Scenario cũ nguyên văn cho bundle cũ. Slice chợ mới đọc registry/action operators thay vì switch nội dung trong React.
3. Audit kinh tế bằng các tuyến bot thực, thử giảm vừa phải start84food/90water/28fuel; điều chỉnh theo kết quả, không cắt60%. Tro Tàn64/52HP,12/11attack; cơ chế guard mở trận ở người đứng đầu và đòn đánh xe báo trước sớm hơn là cấu hình mới, không tăng đôi mọi quái. Giữ retreat/đàm phán/AUTO.
4. Một khu khám phá Phòng trực Thánh An:3phòng nhỏ, một nhân vật đi bằng phím/chuột/chạm, đi/chạy/đèn/cửa/tương tác, vật tư và hồ sơ thật, bóng tiến khi có tiếng động trong vùng tối. Có lối rút và cứu hộ thất bại có giá; không đánh realtime, procgen, physics động, AI đồng đội hoặc skeleton animation.

## Contract khám phá

- Lưới nguyên là authority; client nội suy vị trí, ánh sáng/props là presentation. Bước hợp lệ/tương tác tạo command; không gửi60command/giây, không dùng delta thời gian renderer cho rule. Phím giữ lặp có nhịp, chỉ một command trong một chu kỳ.
- Đứng yên dừng local simulation; đây là khám phá theo nhịp hành động, không giả lập truy đuổi theo thời gian thực. Mỗi hành động tăng local beat, có trần số beat; torch có pin hữu hạn, vùng sáng/cửa ảnh hưởng rule. Nhịp world clock vẫn1giờ.
- Xuất kích dự trù2giờ+khẩu phần theo living crew lúc vào; microaction/thoát không thu thêm. Yêu cầu còn dự trữ1giờ sau reservation để không thua ngay khi bước vào. Không dùng phút hệ thống. NPC world tiến theo khoản2giờ đã quyết toán, không theoFPS.
- Lưu vị trí, hướng nhìn, pin, doors, loot, shadow, local beat, dấu quan sát và state hoàn tất. Một lượt xuất kích/site; không mở lại để farm. Phần thưởng áp dụng nguyên tử đúng một lần khi về cửa ra; cứu hộ bỏ cargo/trả giá thật. Không khóa tuyến bệnh viện cũ nếu bỏ qua/khám phá thất bại.
- Khi exploration đang active, chặn travel/event/train/pathway/scenario/combat ngoài nhiệm vụ ở core. Save/menu/pause không reset simulation hoặc cấp reward. Không cho client tự gửi HP/loot/kết quả.
- Bằng chứng quan sát mở ghi chép về quy tắc; hồ sơ nằm trong khu mở thêm record, không spoil đáp án bằng UI trước khi thấy phản ứng.

## UI/asset

Dựng stage top-down bằng code-native SVG/DOM (lưới ẩn, nội suy, light masks, silhouettes, props vector) trong shell hiện có; Pixi vẫn giữ ở mưa/impact, chưa cần thêm framework. Cấu trúc stage độc lập renderer để thay Pixi nếu cần. Đây là quyết định kỹ thuật cho bản thử nhỏ, không hứa full art/animation. Không gen lại A2/Flow; giữ phối màu than/teal/amber, frame kim loại, chú trọng ánh sáng, có mobile controls và reduced-motion. Âm cue dùng Web Audio hiện có theo action/state; không cần gọi Google.

## Triển khai và kiểm chứng

- Source: fieldwork schema/content + core commands/state/invariants/processor + exploration resolver/read-model; scenario resolver versioned; tactical config; registry/client slots/QA setups; new ExplorationScreen/CSS/input/audio cue.
- Tests hành vi: atomic reject, collision/cửa, ánh sáng-tiếng động-shadow, pin, loot capacity/once-only, return/rescue/time/role/ownership, save/replay giữa phòng và kết thúc, legacy semantics, combat guard/intent, scenario double finish/role/khẩu phần.
- Gates: strict TS, content validators, full check; batch nhỏ bundle mới và bảng tài nguyên theo policy. Browser origin QA5181 (tách save người dùng ở5180) desktop/mobile: vào bệnh viện→đi/tương tác/rút, rule phát tín hiệu, save/load, keyboard/touch, no horizontal overflow, lỗi render/fallback nếu có. Không chạy scripts CDP của bên review.
- Performance: đo dispatch/save/load ở tuyến khám phá dài; nếu pipeline chậm, tách autosave local microactions theo checkpoint debounce và đảm bảo save thủ công/menu flush. Không đánh đổi replay hoặc bỏ invariant để làm nhanh.
- Human playtest mới quyết định độ cuốn/thời lượng2–3phút; tests pass không là bằng chứng game vui.

## Rủi ro và ngoài scope

Không sửa semantics cũ để vá save cũ; legacy có thể giữ lỗi lịch sử, bundle mới chặn exploit. Cân bằng skill7/75%risk cần playtest thêm. Chưa làm climax Bắc Sơn/debrief mới hoặc cinematic mỗi chương; không tuyên bố bản thử là Darkwood hoàn chỉnh. Khi bàn giao cập nhật HANDOFF/PROGRESS, báo cáo gates/giới hạn, commit/push reviewed files, giữ4đầu vào untracked nguyên trạng.


## Kết quả triển khai

- [x] Bundle/registry/slots mới; Scenario resolver cũ giữ nguyên byte.
- [x] Scenario mới kiểm tra vai trò, chi phí, scouts khác nhau và quyết toán một lần; combat/resource config riêng.
- [x] Khu 3 phòng, keyboard/chuột/nút chạm, ánh sáng/tiếng động/cửa/shadow, pin/túi/lore/return/rescue/save/replay.
- [x] Full check: 169 tests / 10 files, validators/strictTS/build pass. Batch 48 hành trình, 0 softlock/reject, 48 save/load/replay; không dùng batch này thay test khám phá.
- [x] Browser desktop1280×720/mobile390×844: chọn actor/entry, WASD/nút chạm, cửa, loot/return, rescue, rule discovery, pause, save/load, menu flush. Có ảnh trong artifacts.
- [x] Audit kinh tế và dispatch/serialize. Đã debounce autosave; chi tiết số đo/giới hạn trong [báo cáo](../reports/LAMPLIGHT_IMPLEMENTATION.md).
- [ ] Human playtest cảm giác/nhịp chơi và cân bằng; không phải gate kỹ thuật đã chứng minh.

Không có ảnh/clip mới hoặc media Google phát sinh. Màn sau Bắc Sơn, realtime/procgen và nhiều Scenario nối tiếp vẫn ngoài scope. Implementation `18d770e` đã commit/push; remote được đối chiếu đúng, chi tiết ở HANDOFF/PROGRESS.

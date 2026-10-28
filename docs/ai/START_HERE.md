# AI mới bắt đầu ở đây

LAST CONVOY là game chiến thuật đoàn xe sinh tồn chạy được trên browser, có core TypeScript headless. Không khởi tạo lại project hoặc viết lại engine từ đầu. Phần lớn MVP và R1 đã có, đã kiểm tra và đã push; A2 có nhiều thay đổi đang được lưu như công việc chưa chốt.

## Thứ tự nhận việc

1. Đọc [AGENTS root](../../AGENTS.md).
2. Đọc [HANDOFF](HANDOFF.md) để biết yêu cầu gần nhất. **Hiện tại người dùng yêu cầu dừng test/QA, hoàn thiện AGENTS và kho docs trước.**
3. Đọc [PROGRESS](../status/PROGRESS.md) để phân biệt đã triển khai/đã QA/đã push.
4. Đọc [PROJECT_MAP](PROJECT_MAP.md), [ARCHITECTURE](../engineering/ARCHITECTURE.md) và guide/plan liên quan.
5. Xem Git status/diff/log và kiểm tra file tồn tại trước khi sửa. Không dùng lịch sử chat hoặc biến REPL làm nguồn duy nhất.

## Những hiểu nhầm cần tránh

- Các event/skill/quest/combat đã là hệ thống thật, không phải UI text giả.
- Phase 0–5 và R1 hoàn tất không có nghĩa A2 đã chốt QA hoặc được push.
- 29 ảnh master A2 là 25 ảnh mới + 4 ảnh A1; 38 ID có event dùng lại nền. Không cần tạo lại 38 ảnh.
- Content `.4` và `.5-r1` dùng rules/slots khác nhau; load save phải chọn bundle đúng.
- Catalog hình client không phải content rules của engine. Thay ảnh không được vô tình đổi seed/replay/save.
- Báo cáo cũ có số test/gate lịch sử. Chỉ HANDOFF và PROGRESS hiện tại quyết định việc còn mở.

## Khi tiếp tục

Nếu người dùng chỉ hỏi thông tin/tài liệu, xử lý đúng phần đó. Nếu người dùng yêu cầu tiếp tục A2/QA, cập nhật trạng thái tạm dừng rồi làm các bước còn mở trong HANDOFF, không quay lại generate hàng loạt hoặc xây lại R1.

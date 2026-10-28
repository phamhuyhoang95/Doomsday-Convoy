# LAST CONVOY — đợt sửa trải nghiệm chơi R1

Ngày 2026-10-28. Người dùng phản hồi MVP nhàm chán: thiếu âm thanh/chiến đấu, chờ/trinh sát ít ý nghĩa, hậu quả/phần thưởng mờ, trạng thái đoàn bị giấu, nhân vật và kỹ năng chưa rõ giá trị. Đây là phạm vi mới được yêu cầu sau Phase 5; không coi các test cũ là bằng chứng game đã đủ hấp dẫn.

## 1. Lõi hành động và nhịp chơi — làm trước UI

- Giữ command processor là nguồn sự thật, deterministic RNG và atomic rejection.
- Trinh sát: dữ liệu riêng từng địa điểm, cache một lần, manh mối, intel giảm rủi ro tuyến trong thời hạn; trinh sát lặp khi lợi thế còn hiệu lực bị từ chối rõ ràng.
- Nghỉ: tiêu khẩu phần/thời gian thật, hồi HP người còn hoạt động và energy; đối thủ vẫn hành động theo tick. Preview chỉ rõ khi đoàn đã khỏe và nghỉ không có lợi.
- Sửa xe: một command riêng, tiêu scrap/thời gian/khẩu phần và hồi condition có giới hạn.
- Kinh nghiệm/điểm huấn luyện từ khám phá và combat; nâng attack/HP/energy bằng điểm, chọn thế đánh đổi công/thủ. Cấu hình nhân vật không làm trôi thời gian thế giới.
- Refactor combat để hỗ trợ encounter phụ theo data, không giải nhầm encounter phụ thành chiến thắng Tro Tàn. Có cuộc đụng độ đầu màn ở chợ với loot thật; boss cuối vẫn tồn tại.

**Gate:** test hành động có hiệu quả, không farm cache, không resource âm, cấu hình/XP có hậu quả combat, encounter phụ không phá arc, replay/save khớp.

## 2. Làm rõ quyết định và trạng thái

- Bảng kết quả sau mọi command: đã tiêu/nhận gì, HP/energy/xe thay đổi, ai gia nhập/gục ngã, skill/quest/knowledge/ownership/NPC thay đổi.
- Choice preview từ content effects: chi phí tổng gồm khẩu phần, phần thưởng, rủi ro và xác suất outcome; phân biệt dự đoán với kết quả đã xảy ra.
- Crew strip luôn hiện trên map: health/energy/status, thế đánh, skill và điểm nâng. Nhấp để mở tùy chỉnh tại chỗ, không bắt chuyển tab.
- Command deck có preview Trinh sát/Nghỉ/Sửa xe và lý do disabled. Hiện reserve theo giờ và intel còn hiệu lực.
- Combat có turn order, mục tiêu chọn được, mô tả kỹ năng/chi phí/cooldown/dự tính damage-heal; feedback đòn đánh/loot/victory rõ ràng.

**Gate:** bấm hành động nhìn thấy ngay thay đổi trên map; hoàn thành encounter sớm bằng UI; dùng skill và tùy chỉnh trước trận.

## 3. Âm thanh và phản hồi cảm giác

- Audio client dùng Web Audio, âm môi trường nhẹ và cues travel/scout/reward/hurt/attack/skill/victory. Không thêm dependency hoặc network assets.
- Chỉ khởi động AudioContext từ tương tác người dùng; có mute/volume, lưu preference; dừng ambient khi về menu/mute. Engine không phụ thuộc audio.
- CSS feedback cho HP/resource/damage/current turn, hỗ trợ reduced motion.

**Gate:** AudioContext chạy sau click, mute/volume phản ánh đúng UI, không console errors hoặc autoplay rejection không xử lý.

## 4. Save compatibility, QA và giao hàng

- Lưu snapshot content v0.1 `.4` trước sửa; giữ command semantics cũ khi chạy bundle legacy để replay/load save cũ không bị phá âm thầm.
- Bản mới dùng content version riêng; không ghi đè slot cũ khi bắt đầu bản mới. Cho tải hành trình cũ và thông báo rõ cách chơi bản cải tiến.
- Chạy tests cũ + tests mới, content validators, build, multi-seed policies và browser production QA với save/load, encounter sớm, skill, crew customization, scout/rest/repair, audio UI và mobile.
- Cập nhật PROGRESS.md sau mỗi phần lớn, ghi bằng chứng thực tế và giới hạn; commit/push thường lên origin/main.

**Done:** mỗi góp ý đều có thay đổi chức năng kiểm chứng được. Không thay việc kiểm tra cảm giác chơi bằng số test; báo rõ phần nào còn cần người chơi thử.

## Kết quả gate R1

- [x] Lõi: cache/intel/rest/repair/XP/stances/encounter phụ thật; invalid command atomic, không nhắm NPC ngoài trận; save/replay khớp.
- [x] UI: crew trên map, tổng chi/outcome preview và report, target/skill/cast; chơi đủ ba màn qua hai trận và ending.shared-dawn.
- [x] Audio: context running sau click, cues nối vào action events, mute/unmute/volume preference; human listening review còn mở.
- [x] Save cũ: genuine Git fixtures replay nguyên snapshot, bundle/slots legacy tách riêng.
- [x] Gate: 103 tests/5 files, validators/typecheck/build; 2.400 batch runs/1.800 wins/600 valid losses/0 softlocks/0 rejected, mọi replay/save khớp.
- [x] Browser: production đầy đủ hành trình, save/load và mobile390px; ảnh/báo cáo đã lưu. Console harness observer được ghi riêng trong report.

Đã hoàn tất phạm vi triển khai R1. Bước tiếp là người dùng chơi lại để đánh giá nhịp và chất lượng trải nghiệm. Xem [PLAYABILITY_REPORT.md](../reports/PLAYABILITY_REPORT.md) và [PROGRESS.md](../status/PROGRESS.md).

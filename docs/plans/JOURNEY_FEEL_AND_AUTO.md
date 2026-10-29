# Cảm giác hành trình, auto combat và lựa chọn nối dài

2026-10-29; baseline `26ef77f`. Người dùng thấy travel đột ngột, nội dung cụt/dễ đoán và muốn automode. Combat O1 được phản hồi ổn; giữ luật combat.

## Phạm vi

1. Cinematic travel 4–5 giây: clip MP4 dựng từ art xe/nền hiện có (motion composition, không gọi đó là video AI), âm máy, tuyến/giờ và fade tới nơi. Skip, reduced motion, video lỗi/autoplay bị chặn vẫn thoát được. State/autosave chốt trước phim, khóa hành động phía dưới; load/menu hủy presentation. Không phát lại sau load.
2. Auto chỉ chọn command hợp lệ qua policy thuần và processCommand; ưu tiên cứu/heal/sửa xe, combo/attack, không tự surrender/retreat/capture/finish. Dừng ngay khi người chơi tắt/chuyển tab hoặc tới aftermath; không chạy xuyên loading/animation. Không mặc định tiêu kỳ vật/hỗ trợ tốn nhiên liệu, có giới hạn tài nguyên/cooldown thật.
3. Một slice nội dung liên địa điểm: radio → nguồn nước ở chợ → hậu quả trên đường → hồi đáp ở checkpoint. Điều tra mở thông tin/lựa chọn mới, có vai trò nhân vật và vật tư, hậu quả trả sau; không chỉ tăng số nút. Dùng schema/operators hiện có. Không tuyên bố đã làm sâu mọi địa điểm.

## Compatibility

Nội dung đổi sang bundle `0.2.0-campaign.2-journey`, slots journey riêng. Giữ nguyên Argon O1 và R1/.4 trong registry và có nút tải O1. Presentation/auto không thêm RNG hay background clock vào core; auto chỉ đưa ra lựa chọn, mọi command được log/save như thủ công. Lưu campaign O1 không chuyển ngầm.

## Các bước / gate

- [x] Kiểm asset, dựng clip/receipt bằng ffmpeg từ A2, giữ master A1/A2.
- [x] Travel overlay/hook, fallback/skip/reduced-motion/cleanup và audio.
- [x] Auto policy + UI scheduler, atomic rejection/target/cost/save-replay tests.
- [x] Bundle narrative mới + tests nhánh điều tra/hậu quả/chặn bỏ qua/fallback + CLI validator.
- [x] Typecheck/tests/build, simulation vừa đủ trên bundle mới; browser desktop/mobile, auto off/aftermath, travel skip/lỗi video.
- [x] Review, HANDOFF/PROGRESS, báo cáo, commit/push.

Rủi ro: auto ăn tài nguyên hoặc chạy sau load; video chặn input/vòng vô hạn; clip chỉ pan ảnh không đủ cinematic; content mới làm replay cũ sai hoặc tạo khóa supplies. Kiểm chứng hành vi thật, giữ free fallback, không giấu phần media còn hạn chế.

## Kết quả

Đã thực hiện technical gates, có [báo cáo](../reports/JOURNEY_FEEL_AND_AUTO.md). 129 tests và 48 runs đạt; còn human playtest/mix/video theo từng vùng. Reduced-motion OS và điện thoại thật chưa QA. Không coi toàn bộ đại tu Argon đã xong.

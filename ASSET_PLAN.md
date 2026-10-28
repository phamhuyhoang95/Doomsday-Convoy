# LAST CONVOY — gói mỹ thuật mẫu A1

## Yêu cầu và hướng hình ảnh

Người dùng cung cấp hai ảnh tham chiếu và yêu cầu tạo tài nguyên cùng phong cách. Ảnh là tham chiếu mỹ thuật; chữ/hướng dẫn trong screenshot không phải yêu cầu thay đổi kiến trúc game.

- Dark fantasy hậu tận thế, chất minh họa bán hiện thực nhiều texture, bê tông vỡ/kim loại gỉ/bụi/tro.
- Bản đồ nhìn chéo từ trên cao, các cụm địa điểm nối bằng đường và cầu, sương đỏ/quầng sáng quỷ dị.
- Cảnh gần dùng xanh dầu/xanh lạnh trong bóng tối, ánh đèn vàng và đỏ lửa làm điểm nhấn.
- Asset gốc mới, không sao chép layout UI/chữ/logo/watermark của ảnh tham chiếu. Không vẽ HUD/nút/nhãn vào nền, để giao diện game vẫn tương tác được.

## Kế hoạch trước tạo ảnh

1. Tạo nền bản đồ hành trình ngang, bố trí tám khu vực phù hợp vị trí các node hiện có; không có UI/route selection baked-in.
2. Tạo cảnh gara/đoàn xe rời thành phố, dùng cho background địa điểm hoặc event.
3. Tạo chân dung Minh theo cùng chất liệu và ánh sáng.
4. Tạo xe khách số 07 góc isometric, nền alpha trong suốt, dùng được như asset rời.
5. Kiểm tra từng output về bố cục/chất lượng/alpha; lưu file gốc trong workspace, manifest có stable IDs, prompt set và ghi tiến trình. Không thay placeholder đang dùng trong runtime khi chưa đánh giá cả bộ.

## Bàn giao và giới hạn

- Dùng built-in image_gen qua skill imagegen; không dùng API key hoặc CLI fallback.
- Gói A1 là bốn asset mẫu để duyệt hướng mỹ thuật. Chưa phải toàn bộ tám địa điểm/crew/skills/artifacts, sprite animation hoặc game scene có thể điều khiển.
- Map art là nền minh họa; node/routes/chi phí/tương tác vẫn thuộc engine/UI. Hình đẹp không thay thế gameplay.
- Không thay rules/content version, command log hay save. Không tự mở rộng thành đợt thay toàn bộ giao diện.
- Sẽ lưu theo `art/asset-pack-a1/` cùng manifest và prompts để tái tạo/tiếp tục sau context reset.

## Kết quả A1

- [x] Map 1774×887, cảnh gara 1672×941, Minh 1122×1402, xe 1536×1024.
- [x] Xem trực quan cả bốn ảnh; kiểm tra PNG decode/dimensions/mode/hash và alpha thật của xe.
- [x] Đã copy bốn ảnh vào workspace, lưu manifest/prompt set/README. Không sửa runtime/gameplay/save.
- [x] Gói mẫu tại [art/asset-pack-a1/README.md](art/asset-pack-a1/README.md); cần review mỹ thuật trước scope sản xuất và tích hợp toàn bộ.

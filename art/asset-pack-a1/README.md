# LAST CONVOY — tài nguyên mẫu A1

Bốn ảnh gốc mới được tạo bằng **built-in image_gen** theo hướng mỹ thuật của hai ảnh người dùng cung cấp: thế giới đổ nát, nhiều texture, bóng tối xanh lạnh, ánh đèn vàng và màu đỏ quỷ dị. Không sao chép UI/chữ/logo trong screenshot.

| Tài nguyên | File gốc | Kích thước | Dùng cho |
|---|---|---|---|
| Bản đồ hành trình | [world-map-a1.png](world-map-a1.png) | 1774 × 887 | Nền map nhìn chéo từ trên cao, 8 cụm landmark |
| Rời gara | [garage-departure-a1.png](garage-departure-a1.png) | 1672 × 941 | Background địa điểm/event |
| Minh | [minh-portrait-a1.png](minh-portrait-a1.png) | 1122 × 1402 | Chân dung nhân vật |
| Xe khách | [convoy-bus-a1.png](convoy-bus-a1.png) | 1536 × 1024, RGBA | Asset xe rời, đầu xe hướng dưới-trái |

Prompt đầy đủ dùng cho từng ảnh nằm trong [prompts.json](prompts.json). [manifest.json](manifest.json) lưu asset IDs, role, dimensions, SHA-256 và kiểm tra alpha; ID map là đề xuất mới, ba ID còn lại đã có trong registry hiện tại.

## Kiểm tra đã thực hiện

- Đã xem trực quan cả bốn output: bố cục tách biệt map/cảnh/portrait/vehicle, cùng hướng vật liệu và ánh sáng, không có HUD/chữ/watermark.
- Pillow decode/load cả bốn PNG thành công; đối chiếu kích thước/mode/hash với manifest.
- Xe có alpha thực: 608.414 pixel alpha=0, cả bốn góc alpha=0, alpha min/max 0/254. Giữ nguyên alpha của ảnh tạo ra, không dùng ảnh nền checkerboard giả.
- Bản đồ không có route marker/nhãn/nút; cần căn vị trí marker và kiểm tra crop responsive khi tích hợp.
- Không sửa engine, runtime asset registry, content version, UI hoặc save trong đợt tạo mẫu này. Không cần chạy lại tests engine cho thay đổi chỉ gồm ảnh/tài liệu.

## Phạm vi sử dụng tiếp

Gói A1 dùng để đánh giá hướng hình ảnh trước khi sản xuất đủ 8 địa điểm, Lan/Bảo/Hà, skill/artifact/anomaly art và UI skin. Xe là một góc tĩnh, chưa có bộ góc quay/animation. Map là minh họa; graph/routes/chi phí/di chuyển vẫn phải render bằng UI và điều khiển bằng GameCommand khi tích hợp.

Ảnh master hiện là PNG, tổng khoảng 12 MB. Khi đưa vào runtime nên tạo bản web tối ưu, giữ master riêng và bảo toàn alpha của xe. Engine tiếp tục chạy khi không tải được hình.

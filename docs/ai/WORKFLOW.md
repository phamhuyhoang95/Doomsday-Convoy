# Quy trình làm việc và bàn giao

## Trước khi sửa

1. Đọc AGENTS → HANDOFF → PROGRESS và yêu cầu mới nhất.
2. Xem Git status/diff và code liên quan; giữ công việc đang có.
3. Viết plan trong `docs/plans/` cho phase/đợt đáng kể: scope, files, bước thực hiện, gates, compatibility và cách thử.
4. Nếu scope chưa rõ, làm phần độc lập đã được ủy quyền; không tự thêm online/services/gameplay mới.

## Trong khi làm

- Chia việc thành bước có sản phẩm thật; cập nhật PROGRESS sau từng nhóm lớn.
- Đưa rules vào engine/content, không vào React. Lựa chọn UI phải dispatch command thật.
- Giữ source/prompt/metadata trong repo. Không phụ thuộc tool session IDs hoặc tab browser để tiếp tục.
- Nêu rõ điều đã học được, điều chưa chắc và bước tiếp, tránh lặp lại lịch sử dài trong mỗi update.
- Khi gặp lỗi, sửa nguyên nhân và ghi gate thực tế. Không đổi assertions/fixtures/log để che sai khác.

## Kiểm tra khi được phép

Đọc HANDOFF trước: hiện người dùng đang dừng test/QA. Sau yêu cầu tiếp tục, chạy checks phù hợp thay đổi; không lặp batch lớn nếu không có lý do mới. `npm run check` gồm world/content/art validators, Vitest, TS và Vite build.

Browser phải dùng UI automation được cấp, lấy state mới sau thao tác và xác minh hành vi đã xảy ra. AssetArt fallback cần thử khi file lỗi; responsive cần xem ảnh thật, không chỉ compile. Không bypass browser URL/security policy; dùng đường HTTP được hỗ trợ cho gallery.

## Cập nhật tài liệu

| File | Nội dung phải có |
|---|---|
| `docs/ai/HANDOFF.md` | Yêu cầu gần nhất, việc đang dở, lệnh được phép/chưa được phép, bước tiếp cụ thể |
| `docs/status/PROGRESS.md` | Milestones, gates có bằng chứng, checkpoint Git và phần chưa xong |
| `docs/plans/...` | Plan trước làm và kết quả gate sau làm |
| `docs/reports/...` | Thay đổi thực tế, file chính, lệnh/kết quả, cách thử, giới hạn |
| `docs/README.md` | Mục lục tới tất cả tài liệu chính thức mới |

Nếu dữ liệu lịch sử dài hoặc mâu thuẫn trạng thái mới, giữ trong history và đặt cảnh báo. Không xóa lịch sử để làm sạch số liệu. Các file root cũ là forwarding links; chỉnh canonical docs.

## Git và checkpoint

Người dùng cho phép commit/push lên origin/main để an toàn. Chỉ stage phần đã đánh giá; không force push/reset hoặc commit secret/node_modules/dist/save cá nhân. Xem git log/status thay vì tin SHA trong chat cũ.

WIP checkpoint được dùng để bảo toàn công việc khi dừng/đổi ưu tiên. Tên commit và HANDOFF phải ghi QA còn mở. Sau push đối chiếu SHA remote nếu đã làm; không tuyên bố push nếu mới commit local.

## Khi kết thúc một lượt

Ghi đủ để AI mới bắt đầu từ filesystem: scope hiện tại, files/source of truth, kết quả có thật, pending checks, lỗi/giới hạn, bước tiếp. Trả lời ngắn gọn cho người dùng với link AGENTS/docs/progress. Không tự tiếp tục test sau khi người dùng đã yêu cầu dừng.

# Quy trình làm việc và bàn giao

## Luồng làm việc

Không có phân công model, mức suy luận hoặc số lượng agent bắt buộc. Hoàn thành công việc trong phiên hiện tại; chỉ chia việc khi điều đó thực sự cần thiết. Nếu chia việc, giao rõ phạm vi và tránh nhiều người sửa cùng file.

1. Xác định mục tiêu, scope và tiêu chí nghiệm thu; điều tra source khi còn điều chưa rõ.
2. Chốt plan và các quyết định quan trọng về kiến trúc, version hoặc compatibility trước khi sửa rules.
3. Triển khai theo từng phần có thể review, bàn giao diff và cách thử.
4. Kiểm chứng trong phạm vi người dùng cho phép, lưu lệnh, kết quả và artifact thật.
5. Review diff và bằng chứng, sửa findings, kiểm tra lại phần bị ảnh hưởng.
6. Cập nhật HANDOFF/PROGRESS và giao hàng. Ghi ý tưởng ngoài scope vào plan để xét sau.

### Brief và bàn giao tối thiểu

- **Brief nếu có chia việc:** mục tiêu; plan/source cần đọc; file được sửa; giới hạn; phụ thuộc; quyền chạy QA hiện tại; acceptance criteria; đầu ra và nơi lưu.
- **Bàn giao:** đã làm; file/diff hoặc nguồn; phát hiện; command/kết quả/artifact thật; chưa kiểm chứng; blocker và bước tiếp đề xuất.
- **Review:** file/line; trigger; hậu quả; mức ưu tiên; cách xác minh sửa; kết luận đạt/cần sửa/chưa đủ bằng chứng.

Ghi đầu việc, người phụ trách nếu có, trạng thái và link bằng chứng vào checklist của plan đang dùng; không tạo hệ thống tracker riêng chỉ để điều phối.

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

Đọc yêu cầu mới nhất và HANDOFF trước; chạy checks trong phạm vi được phép. Yêu cầu chỉ chỉnh tài liệu không tự mở lại QA. Chạy checks phù hợp thay đổi; không lặp batch lớn nếu không có lý do mới. `npm run check` gồm world/content/art validators, Vitest, TS và Vite build.

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

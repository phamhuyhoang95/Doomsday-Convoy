# Quy trình làm việc và bàn giao

## Vai trò và luồng điều phối

Nguồn chính thức về model/effort và ranh giới trách nhiệm là [AGENTS.md](../../AGENTS.md#phân-công-model-bắt-buộc). Astra (`gpt-6-astra`) dùng **medium** để điều phối, chia task, lập plan thông thường, đề xuất ý tưởng và review thường lệ. Chỉ dùng **Astra high** cho review kiến trúc quan trọng hoặc quyết định quan trọng. Sol 6.1 và Terra 6.1 tiếp tục dùng **high**.

1. **Astra** ghi mục tiêu, scope và acceptance criteria; giao **Terra** khảo sát source/thông tin nếu còn điều chưa rõ.
2. **Terra high** bàn giao bằng chứng và các câu hỏi còn mở; **Astra medium** hoàn thiện plan trước khi giao code. Nếu có quyết định kiến trúc/scope/compatibility quan trọng, giao **Astra high** chốt phần đó rồi trở lại medium.
3. **Sol** triển khai theo plan, bàn giao diff và cách thử. Việc độc lập có thể song song; tránh ghi trùng file hoặc kiểm tra snapshot đang bị sửa.
4. **Terra** chạy kiểm chứng phù hợp khi được phép, lưu lệnh/kết quả/artifact. QA đang dừng thì ghi chưa kiểm chứng, không tự chạy lại.
5. **Astra medium** review diff và bằng chứng thường lệ; phần kiến trúc/quyết định quan trọng chuyển **Astra high**. Gửi findings cụ thể cho **Sol** sửa, **Terra** kiểm tra lại phần liên quan. Tự xem lại plan nếu giả định ban đầu sai; kết thúc review quan trọng thì điều phối về medium.
6. **Astra** cập nhật HANDOFF/PROGRESS, chốt trạng thái thật và điều phối giao hàng. Ý tưởng ngoài scope lưu thành đề xuất để xem xét sau.

Mặc định mọi bước điều phối của Astra ở mức medium. Sửa tài liệu điều phối nhỏ có thể làm trực tiếp, không bắt buộc tạo ba agent. Việc chọn model phải thực hiện bằng tùy chọn thật của runtime; chỉ viết tên vai trò trong Markdown không đổi model/effort đang chạy.

### Brief và bàn giao tối thiểu

- **Brief:** mục tiêu; plan/source cần đọc; model + effort (ghi lý do nếu nâng Astra lên high); file được sửa; giới hạn; phụ thuộc; quyền chạy QA hiện tại; acceptance criteria; đầu ra và nơi lưu.
- **Bàn giao:** đã làm; file/diff hoặc nguồn; phát hiện; command/kết quả/artifact thật; chưa kiểm chứng; blocker và bước tiếp đề xuất.
- **Review:** file/line; trigger; hậu quả; mức ưu tiên; cách xác minh sửa; kết luận đạt/cần sửa/chưa đủ bằng chứng.

Ghi đầu việc, người phụ trách, trạng thái và link bằng chứng vào checklist của plan đang dùng. Astra cập nhật trạng thái tổng hợp; không tạo hệ thống tracker riêng chỉ để điều phối.

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

Đọc yêu cầu mới nhất và HANDOFF trước; chỉ giao Terra chạy checks trong phạm vi được phép. Yêu cầu chỉnh tài liệu điều phối không tự mở lại QA. Chạy checks phù hợp thay đổi; không lặp batch lớn nếu không có lý do mới. `npm run check` gồm world/content/art validators, Vitest, TS và Vite build.

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

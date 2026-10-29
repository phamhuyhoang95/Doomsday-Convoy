# Giọng đọc, nhạc và clip bằng Google — phương án cho LAST CONVOY

Đối chiếu nguồn ngày **2026-10-29, Asia/Saigon**. Trạng thái: nghiên cứu/đề xuất; chưa xem billing riêng của người dùng, chưa gọi API, tạo media, mua credit hoặc tiêu ngân sách. Người dùng cho biết có Google AI Pro và khoảng $100 Google Cloud; chưa rõ loại khoản credit và ngày hết hạn.

**Bổ sung sau trao đổi Argon cùng ngày:** Người dùng xác nhận vẫn có Google AI Pro. Ưu tiên tạo nhạc qua Gemini web bằng quyền có sẵn, không mặc định phải dùng Lyria API trong bảng nghiên cứu bên dưới. [Gemini Help](https://support.google.com/gemini/answer/16901237?hl=en) xác nhận tạo và tải nhạc; [Flow Help](https://support.google.com/flow/answer/16526234?hl=en) hiện ghi Pro thêm 1.000 Flow credits/tháng. Chưa kiểm tra tài khoản/số dư, chưa tạo output. Phương án hiện hành theo [ARGON_MEDIA_PLAN](ARGON_MEDIA_PLAN.md); các dự toán/API bên dưới là tham khảo, không phải quyết định mua/gọi dịch vụ.

## 1. Chọn công cụ theo đầu việc

| Nhu cầu | Đề xuất | Cách dùng cho game |
|---|---|---|
| Clip 6–8 giây | Flow trong Google AI Pro, dùng quyền có sẵn trước | Ảnh master A2 → clip mở đầu/địa điểm/cao trào; chọn bản tốt, tải về và biên tập |
| Giọng Việt | Cloud Text-to-Speech: thử Gemini-TTS và Chirp 3 HD | Thử vài câu Minh/Lan/Bảo/radio; chọn giọng rồi tạo câu cố định, lưu file |
| Nhạc không lời | Thử Lyria để có bản nhạc gốc, biên tập thành loop | 4 mood: đi đường, tìm kiếm, chiến đấu, nghỉ; trộn ambience/SFX riêng |
| Chuyển động trong trận | Animation client từ events + art/sprite | Đòn đánh/vị trí/đèn/sương đáp ứng state thật; video dùng cho điểm nhấn |

Media tạo offline, tải vào game như asset thông thường. Không cần thuê backend chỉ để phát nhạc hoặc gọi TTS/video mỗi lần chơi.

## 2. Google AI Pro và Flow

Flow Help hiện ghi Pro được thêm **1.000 credit/tháng**; tài khoản có thêm 50 credit/ngày. Credit ngày/tháng không cộng dồn sang chu kỳ sau. Với Pro: Veo 3.1 Lite **10**, Fast **20**, Quality **100 credit cho mỗi output**. Một request có thể tạo nhiều output. Đây là số trên trang trợ giúp, chưa xác minh số dư/tính năng khả dụng của tài khoản cụ thể. [Nguồn Flow](https://support.google.com/flow/answer/16526234?hl=en).

Phương án cho slice: lấy 3 shot, mỗi shot thử 5 bản Fast = 15 output × 20 = **300 credit**; chọn khoảng 3 clip cuối nếu chất lượng đạt. Dành phần còn lại cho sửa continuity và shot mở rộng. Không coi 15 output là 15 clip dùng được. Ưu tiên ảnh nền/xe có sẵn, cảnh ít nhân vật và không thoại khớp môi.

Gợi ý shot: xe rời gara trong tro; đèn bệnh viện bật dần khi chuông rung; đèn pha Tro Tàn xuất hiện sau làn sương. Không nhúng HUD/chữ vào video. Kiểm tra watermark hiển thị, crop, chuyển động lỗi và tính đồng nhất trước đưa vào game; giữ metadata/provenance của output.

## 3. Giọng tiếng Việt và chi phí

Gemini-TTS liệt kê **vi-VN ở trạng thái GA** và hỗ trợ điều khiển cách đọc bằng prompt. Đề xuất làm audition 3 giọng × 3 câu có tên riêng, câu thì thầm và lời cảnh báo; chốt phát âm/nhịp rồi mới tạo hàng loạt. [Hỗ trợ ngôn ngữ](https://docs.cloud.google.com/text-to-speech/docs/gemini-tts).

Cloud TTS niêm yết Chirp 3 HD miễn phí tới **1 triệu ký tự/tháng**, phần vượt **$30/triệu ký tự**; Gemini 2.5 Flash TTS không có free tier trong bảng Cloud, giá input **$0.50/triệu text tokens**, output **$10/triệu audio tokens**, 25 audio tokens/giây. Ví dụ tự tính: 30 phút audio output = 45.000 tokens ≈ **$0.45 phần output**, chưa gồm input, các lần tạo lại và dịch vụ khác. Đây là giá Cloud TTS cho model nêu tên, không phải mọi model TTS đều có giá đó. [Bảng giá Cloud TTS](https://cloud.google.com/text-to-speech/pricing).

Slice chỉ cần 20–30 câu có vai trò rõ. Lưu mỗi câu với speaker ID, text key, prompt/model/voice, pronunciation notes và subtitle. Giọng có cảm xúc nhưng phải nghe rõ trên loa điện thoại; đoạn quan trọng có text tương đương. Chưa cần giọng clone hoặc lip-sync.

## 4. Nhạc nền

Lyria 3.5 trên Gemini Developer API hiện niêm yết **$0.08/bài**; 20 lần tạo thử tương đương **$1.60 phí tạo** theo bảng này. Đây là ngân sách API riêng, không mặc định thuộc AI Pro hay khoản Cloud credit. [Giá Gemini API](https://ai.google.dev/gemini-api/docs/pricing).

Đề xuất chọn 4 bản không lời rồi biên tập điểm nối, cân âm lượng và crossfade trong game. Đừng giả định output là loop seamless hoặc có stems tách sẵn. Model có SynthID trong audio; trang hướng dẫn nêu watermark không nghe thấy. [Hướng dẫn Lyria](https://ai.google.dev/gemini-api/docs/music-generation).

Đánh giá bằng nghe thật: đúng mood, không quá dày, không có giọng hát/lời ngoài yêu cầu, không che thoại/SFX. Tiếng chuông/nhịp tim báo nguy cần đọc được bằng hình/phụ đề tương ứng khi tắt âm.

## 5. $100 Cloud: cách hiểu và phân bổ

**Google AI Pro/Flow credits, Cloud promotional credits và Gemini Developer API billing là các nguồn thanh toán khác nhau.** Chưa thể cam kết $100 sẽ trả cho mọi dịch vụ. Ví dụ chương trình welcome credit được Google mô tả loại trừ Gemini API trong AI Studio; cần xem grant thực tế, ngày hết hạn, billing account và dịch vụ/SKU được áp dụng. [Cloud Billing](https://docs.cloud.google.com/billing/docs/in-product-billing-setup).

Phương án tiết kiệm: dùng Flow sẵn có cho video; dùng hạn mức miễn phí Cloud TTS nếu phù hợp; giữ phần lớn $100 cho vòng sản xuất sau. Không cần cố tiêu hết để làm slice.

| Khoản dự trù tối đa | Sử dụng có điều kiện |
|---:|---|
| $5 | Audition/retake thoại qua Cloud TTS, nếu grant cho phép; mức dự trù không phải báo giá bắt buộc |
| $5 | Lưu trữ/truyền media thử nếu thực sự cần; ưu tiên lưu local cho bản dev |
| $20 | Thử dịch vụ media Cloud được xác minh đủ điều kiện, khi Flow chưa đáp ứng |
| $70 | Giữ dự phòng; chưa phân bổ/gọi dịch vụ |

Nhạc Lyria qua Gemini Developer API: có thể cần khoảng **$1.60 tiền/API balance riêng cho 20 mẫu** nếu grant Cloud không áp dụng. Không chuyển đổi hoặc bật billing thay người dùng trong lượt đề xuất này. Khi sản xuất, lập danh sách số output/độ dài/giá, giới hạn batch và đối chiếu chi phí sau batch đầu; cảnh báo ngân sách không thay thế giới hạn số lần gọi.

## 6. Tránh hướng dẫn Veo API đã lỗi thời

Nguồn canonical Veo Developer API ghi ba model preview Veo 3.1 đã **ngừng ngày 22/10/2026**. Bản trang giá có query/cache cũ vẫn còn giá Veo theo giây; không dùng các con số đó để báo giá cho tích hợp mới. Hướng dẫn nêu Gemini Omni Flash hoặc model GA trên Gemini Enterprise Agent Platform làm đường chuyển tiếp. Điều này không đồng nghĩa Veo trong Flow ngừng: Flow hiện vẫn có bảng credit riêng. [Thông báo Veo](https://ai.google.dev/gemini-api/docs/veo?hl=en).

Với dự án này ưu tiên Flow trước. Nếu tự động hóa Cloud video sau này, xác minh model/region/quota/SKU và đơn vị tính hiện hành rồi mới dự trù; không lấy giá Gemini Developer API áp sang Vertex/Agent Platform. Không cần viết integration API video ngay để đưa vài clip đã xuất vào game.

## 7. Pipeline đề xuất, chưa triển khai

1. Chốt beat sheet, thoại và shot list gắn với gameplay; lựa chọn nào cần được nghe/thấy rõ.
2. Chuẩn bị brief/prompt và khảo sát dịch vụ/billing trong phạm vi được người dùng giao; sản xuất batch nhỏ trước, giữ receipts. Raster image vẫn theo skill imagegen hiện hành; không tự đổi nhà cung cấp tạo ảnh A2.
3. Lưu master WAV/video cùng manifest: asset ID, text key, model/voice, prompt, source, ngày, chi phí, transcript, duration, phiên bản điều khoản/ghi chú sử dụng.
4. Biên tập/encode thành media web; giữ master riêng, không nhúng API key vào client. Theo dõi dung lượng, tải theo cảnh và fallback ảnh/text khi thiếu media.
5. Nối registry và presentation/audio director; controls bật/tắt/volume/phụ đề/skip. Clip không kích hoạt thêm command hay RNG khi tua/bỏ qua.
6. Kiểm tra nghe/xem khi QA được phép; duyệt sự ăn khớp với scene và nhịp chơi. Đọc điều khoản đúng dịch vụ dùng để tạo output trước phát hành; không mặc định subscription đồng nghĩa độc quyền tác phẩm.

Tiêu chí chốt media: phát âm đúng, nhân vật/xe nhất quán, không chữ rác, không lặp âm gây mệt, có subtitle/fallback, không chặn tương tác, dung lượng phù hợp. Chất lượng cuối được quyết định bằng nghe/xem, không chỉ file tồn tại hoặc API trả thành công.

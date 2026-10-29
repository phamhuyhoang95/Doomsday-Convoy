# R4 — đề xuất làm lại trải nghiệm LAST CONVOY

Ngày: 2026-10-29 (Asia/Saigon). Trạng thái: **đề xuất để review, chưa triển khai**. Người phụ trách thiết kế/review: Astral High; điều tra source và dịch vụ: Terra 6.1 High; khi triển khai: Sol 6.1 High.

Yêu cầu: game chạy được nhưng tẻ nhạt, màn quá ngắn, thiếu cảm giác âm nhạc/chuyển động; cần ý tưởng cải tổ, có thể làm lại, và cách tận dụng Google AI Pro + khoảng $100 Google Cloud. Lượt này chỉ đọc source, nghiên cứu web và viết kế hoạch; không chạy test/browser QA, tạo media trả phí hoặc thay code game.

## 1. Quyết định đề xuất

**Làm lại vòng chơi, cấu trúc địa điểm và cách trình diễn trên lõi engine hiện có.** Đích sản phẩm: người chơi thật sự chỉ huy một đoàn xe đang bị săn đuổi, phải đưa người ra ngoài kiếm vật tư, đánh đổi an toàn để khám phá quỷ dị và sống cùng hậu quả.

Giữ command processor, seeded RNG, graph, facts/knowledge, inventory ownership, Story Contracts, save/replay và art A1/A2 có thể dùng. Các phần này là nền tái sử dụng, chưa phải khẳng định mọi implementation hiện tại đều đúng. Thay phần campaign quá ngắn, quest một bước, các trận đánh ít mục tiêu và màn hình thao tác chủ yếu trên thẻ/số liệu.

Ưu tiên làm một đoạn chơi hoàn chỉnh 20–30 phút trước. Sau khi người chơi thực tế muốn chơi tiếp, mở rộng thành chiến dịch 65–90 phút lần đầu. Đây là mục tiêu thiết kế, chưa phải thời lượng đã đo. Người chơi quen đường có thể đi nhanh hơn; không ép chờ, tăng HP vô lý, thêm nút xác nhận hoặc bắt xem phim để đạt số phút.

## 2. Điều tra hiện trạng

Baseline: Git `817b9cb`, có code R2/R3. Dưới đây là dữ kiện source; nhận định về cảm xúc là giả thuyết, chưa phải kết quả chơi thử.

| Dữ kiện | Nguồn | Tác động cần xử lý |
|---|---|---|
| 8 địa điểm/11 tuyến; tuyến garage → market → service → checkpoint → refuge chỉ 4 chặng, vẫn có điều kiện quest | `src/content/world.ts:61–204`, `campaign.ts:193–199` | Chuyến đi có thể bị nén, tên ba vùng chưa tạo ra ba vòng chơi sâu |
| Có thể lấy đèn tại service rồi phong tỏa bệnh viện; contract hospital giải bằng alternate | `src/content/events.ts:102–157`, `quests.ts:8–17` | Fallback đúng chức năng nhưng có thể bỏ mất cao trào; cần một nhiệm vụ thay thế có hậu quả riêng |
| 12 event một lần; lựa chọn thường có một outcome trực tiếp, director resolve event | `src/content/builders.ts:43–75`, `events.ts:349–363`, `src/narrative/director.ts:91–133` | Quyết định có hệ quả thật nhưng ít bước chuẩn bị, diễn biến và ứng biến |
| 4 contract, builder mỗi contract một objective; nhiều ending dựa facts/ownership | `src/content/quests.ts:3–37`, `builders.ts:77–103`, `endings.ts:4–49` | Nhiều kết thúc không tự tạo chiều sâu trong một chuyến |
| Khởi đầu 96 food/108 water/34 fuel; ba người tiêu 3 food/water mỗi tick; còn thưởng dọc đường | `src/content/campaign.ts:165–167`, `world.ts:162–175` | Có thể ít áp lực trên tuyến ngắn; phải cân kinh tế theo vòng chơi mới, chưa kết luận chỉ giảm đồ là đủ |
| Combat mở qua lựa chọn; có thể tránh các trận chính; nâng cấp tập trung chỉ số/stance; địch ít kỹ năng | `campaign.ts:15–92`, `events.ts:262–302`, `operations.ts:5–50` | Thiếu tình huống khiến người chơi đổi chiến thuật; tránh đánh vẫn phải có gameplay có ý nghĩa |
| Tro Tàn có clock lấy kỳ vật sau tick 22 | `src/content/rival.ts:3–13` | Tuyến ngắn có thể kết thúc trước khi đối thủ gây biến cố đáng kể |
| BGM oscillator/noise có thật, cần unlock; âm lượng master mặc định 0.4 × 0.35 | `src/client/audio.ts:24–36,61–105,112–168` | Cần nghe/kiểm tra unlock, mix và chuyển cảnh; chưa biết nguyên nhân người dùng không nghe thấy |
| Có xe chuyển động 0.9s, hit flash/shake/vignette, ảnh tĩnh; không thấy mp3/ogg/wav/mp4/webm trong src/public | `WorldMap.tsx:171–200`, `styles/playability.css:962–1031` và inventory tệp | Các hiệu ứng đã có chưa tạo diễn xuất hoặc không khí đủ rõ; không nên báo “đã có animation” là giải quyết phản hồi |

Độ tin cậy: cấu trúc/giá trị code cao; thời lượng thực tế, cảm nhận nhạc, độ khó và tính hấp dẫn cần human playtest. Các số 103 tests/800 runs trong báo cáo cũ không đo được sự thú vị.

## 3. Vòng chơi mới

**Đọc tình hình → chọn tuyến → chuẩn bị người/xe → thám hiểm địa điểm → quyết định ở lại hay rút → giải quyết khủng hoảng → nhận hậu quả/nâng cấp → tiếp tục hành trình.**

### Địa điểm là một khu vực để chơi

- Mỗi địa điểm chính có 4–6 điểm tương tác nhìn thấy trên cảnh: bãi xe, kho, phòng điện, lối thoát, dấu vết bất thường. Có vật thể/đường nối/vị trí nhân vật, trạng thái thay đổi ngay trong cảnh.
- Chọn 2 người ra ngoài, 1 người giữ xe. Vai trò tạo phương án khác nhau: Bảo mở máy/phá khóa, Lan cứu người/nhận biết triệu chứng, Minh che chắn/đàm phán. Không khóa nhiệm vụ vì thiếu đúng một người; có cách thay thế tốn thời gian/vật tư hoặc chấp nhận mất mát.
- Lục soát sâu thêm tăng nguy cơ bị phát hiện. Có dấu hiệu dự báo: ánh đèn, bước chân, radio, đồng hồ cảnh giới; người chơi biết mình đang mạo hiểm điều gì.
- Vật tư hữu hạn, chỗ mang về hữu hạn: mang bình nhiên liệu hay máy phát? Thêm một lượt chuyển đồ có thể kéo địch đến. Khối lượng chỉ áp dụng một cấp đơn giản ở slice, tránh biến game thành quản lý ô túi phức tạp.
- Quyết định phải thay đổi tối thiểu một thứ có ích cho chặng sau: năng lực, đường đi, thương tích, người đi cùng, quan hệ, quyền sở hữu hoặc tình hình đối thủ. Không chỉ cộng/trừ tài nguyên rồi quên.

### Chiến đấu có vị trí và mục tiêu

- Sân nhỏ 6–9 vị trí/điểm đứng, có chỗ nấp, cửa, bình xăng, máy phát và xe cần bảo vệ. Dùng art 2D có chiều sâu, không cần chuyển engine 3D.
- Ngân sách hành động dự kiến 2 AP/lượt: di chuyển/che chắn/tương tác có giá; kỹ năng mạnh cạnh tranh với vị trí an toàn. Chốt con số sau thử nghiệm, không áp vào legacy.
- Mục tiêu mẫu: giữ máy phát 3 hiệp để mở cửa; đưa Hà đến xe; lấy thùng thuốc rồi rút; chạy khỏi anomaly sau khi thực hiện đúng quy tắc. Thắng không luôn đòi giết hết đối thủ.
- Vai trò địch rõ: kẻ phá xe, kẻ ghìm chân, kẻ gọi viện. Ý đồ chỉ tiết lộ điều nhân vật quan sát được, tránh biến UI thành toàn tri với mọi bí mật.
- Kỹ năng đổi quyết định: kéo đồng đội khỏi tầm nguy hiểm, chặn lối, chuyển hướng truy đuổi, tiết lộ hành lang an toàn. Mỗi nhân vật hai lựa chọn build ban đầu, có thể nâng theo hướng khác nhau; tăng số chưa phải mục tiêu chính.
- Giữ giải pháp tránh giao tranh: nghi binh, đổi vật tư, cắt điện/lách đường. Chúng giải một tình huống thực tế với chi phí/hậu quả riêng; không thu hồi quyền rút lui chỉ để kéo dài game.

### Đoàn xe là thứ người chơi gắn bó

- Hai khe nâng cấp cạnh tranh: thùng nhiên liệu, phòng cứu thương, giá chở đồ hoặc giảm tiếng ồn. Phải chọn phong cách chuyến đi.
- Một vết thương có thể làm nhân vật cần người hỗ trợ ở chặng sau; chăm sóc sớm mở lại phương án. Không cộng hàng chục debuff ngay bản đầu.
- Cứu Hà mở thông tin/đường tắt và một lựa chọn về sau; bỏ Hà có lợi trước mắt nhưng thấy dấu vết hậu quả trong cảnh và thoại.
- Điểm nghỉ ngắn có đối thoại và một quyết định quan hệ hoặc phân công. Chỉ dùng vài mâu thuẫn được viết tốt, chưa làm mô phỏng xã hội lớn.

### Quỷ dị là quá trình điều tra

- Thu 2–3 manh mối ở các bối cảnh khác nhau, thử giả thuyết bằng hành động có rủi ro có thể hồi phục, rồi vận dụng quy tắc trong một cảnh áp lực.
- Quy tắc ổn định trong một lượt; nếu thay giữa các lượt, seed chọn một gói quy tắc/manh mối nhất quán ngay đầu. Không đổi bí mật sau lựa chọn của người chơi.
- Sai lần đầu tạo tín hiệu và tổn thất có thể hiểu, không giết ngay vì câu đố đoán mò. Cho phép rút và mang manh mối về.

## 4. Một đoạn chơi mẫu 20–30 phút: “Chợ mất điện”

Các khoảng phút là nhịp mục tiêu, không có timer ép người chơi đọc.

| Nhịp | Việc người chơi thực sự làm | Hậu quả |
|---|---|---|
| 0–2 phút | Radio cầu cứu; thấy xe thiếu nhiên liệu; chọn người ra ngoài và dụng cụ | Đội giữ xe/đội thám hiểm có năng lực khác nhau |
| 2–7 phút | Khám phá 4–6 điểm trong chợ; quan sát dây điện, dấu chân, cửa kho | Chọn lối đi và biết một phần rủi ro trước khi cam kết |
| 7–12 phút | Tìm Hà bị kẹt; cân giữa dùng điện mở cửa, lấy xăng hoặc cứu người trước | Bật máy phát tạo ánh sáng/tiếng ồn, thay tình hình canh gác |
| 12–19 phút | Hộ tống người và đồ qua bãi xe; có thể đánh giữ lối hoặc dụ địch sang cổng khác | Mục tiêu cứu/thoát; xe và đồ có thể chịu thiệt hại riêng |
| 19–25 phút | Quyết định quay lại lấy máy phát hay rời đi; áp lực truy đuổi tăng | Có thể mang về lợi ích khác nhau, không mặc định vét sạch |
| 25–30 phút | Nghỉ ngắn, xử lý thương tích, lắp một module; radio gợi đường kế tiếp | Thấy ngay lựa chọn trước đã đổi đội hình và tuyến đường |

Một chuỗi cụ thể: để Bảo ở xe giúp sửa máy nhanh, nhưng đội ngoài phải mất thời gian phá cửa kho. Dùng máy phát mở cửa cứu Hà cũng bật còi báo động. Minh phải giữ hành lang trong lúc Lan đưa Hà ra xe. Lấy được Hà nhưng bỏ máy phát khiến chuyến sau có người dẫn đường mà thiếu nguồn điện cho thiết bị. Nếu rút sớm, vẫn kết thúc nhiệm vụ hợp lệ với phần thưởng thấp hơn.

Slice giới hạn: 1 địa điểm chính gồm 4–6 điểm tương tác; 3 nhân vật gốc + Hà; 2 biến thể giải quyết khủng hoảng (đánh/né); 3 vai trò địch; 2 module xe; 1 manh mối quỷ dị; 1 lần nghỉ. Chưa thêm cả ba hồi hoặc hàng chục vật phẩm.

## 5. Mở rộng khi slice có sức hút

| Hồi | Mục tiêu thời lượng lần đầu | Nội dung mới cần mang lại |
|---|---:|---|
| Rời thành phố | 20–25 phút | Thám hiểm, hộ tống, học đánh đổi người/đồ/xe |
| Bệnh viện | 25–35 phút | Điều tra nhiều bước, giải quy tắc, thoát hiểm; nhánh tránh bệnh viện là nhiệm vụ thay thế |
| Tro Tàn | 20–30 phút | Đối thủ phản ứng với hành trình, thương lượng có đòn bẩy hoặc trận bảo vệ đoàn xe |
| Tổng | 65–90 phút | Mục tiêu đo bằng thời gian chơi chủ động, không cộng phim/chờ tải |

Mỗi lần chơi chỉ chọn một phần tuyến/biến thể. Dùng pool tình huống được biên soạn và seed để đổi đường tiếp cận, món đồ và hệ quả; chưa sinh nội dung AI runtime. Replay đến từ chiến thuật/build/nhánh khác, không chỉ đổi vài phần thưởng RNG.

## 6. Âm nhạc, chuyển động, giọng và phim

Thứ tự ưu tiên: **âm nhạc/âm cảnh nghe rõ + phản hồi hành động → chuyển động trong cảnh → thoại điểm nhấn → clip ở cao trào**. Gameplay và âm thanh đầu tiên được làm trong slice; voice/clip đầy đủ có thể bổ sung sau.

- Nhạc: 4 bản không lời (đường đi, tìm kiếm, nguy hiểm/chiến đấu, nơi nghỉ); loop được biên tập, chuyển âm lượng mượt và hạ nhạc khi có thoại. SFX động cơ/cửa/đồ vật/va chạm giúp xác nhận hành động. Có nút nghe thử, volume nhạc/SFX/thoại và trạng thái unlock rõ.
- Chuyển động: tách nền/foreground/parallax; sương, tro, đèn, xe; nhân vật có idle/di chuyển/ra đòn/trúng đòn/rút. Nghe và thấy từng người hành động thay vì tất cả số đổi cùng lúc.
- Một command có thể tạo nhiều domain events; client xếp timeline diễn xuất theo events, có tua nhanh/skip và khóa gửi trùng command trong lúc cần thiết. Animation không quyết định damage, RNG hoặc world time.
- Giọng: slice 20–30 câu ngắn ở radio/cứu người/quyết định/cảnh báo, mở rộng 40–60 câu cho ba hồi. Viết voice bible ba nhân vật, làm mẫu nghe trước; không đọc toàn bộ UI. Có phụ đề, nghe lại, skip; manh mối luôn có văn bản tương đương.
- Clip: 3–4 đoạn 6–8 giây: rời thành phố, chuông bệnh viện, Tro Tàn xuất hiện, kết thúc. Tạo từ ảnh master để giữ phong cách; ưu tiên cảnh rộng không cần lip-sync. Clip có poster/fallback, tải trước có giới hạn, không chặn game khi lỗi mạng. Clip tạo không mặc nhiên loop liền mạch.
- Media được tạo trước và đóng gói cùng game. Không gọi dịch vụ trả phí trên mỗi lượt chơi. Giảm chuyển động/tắt âm thanh vẫn chơi và hiểu được game.

Cách tận dụng Google và ngân sách: [GOOGLE_MEDIA_PRODUCTION](../assets/GOOGLE_MEDIA_PRODUCTION.md).

## 7. Kế hoạch triển khai và điều kiện qua từng bước

### R4.0 — chốt baseline và thiết kế slice

- Astral: chốt sơ đồ chợ, beat sheet, 6 quyết định quan trọng, hai cách thoát và ngân sách kinh tế/thời gian; đưa phần ngoài scope vào backlog.
- Terra: khi được yêu cầu triển khai/QA, ghi thời lượng và đường đi baseline, nghe audio/unlock trên desktop/mobile, audit compatibility của R2/R3. Hiện `campaign.ts:163` vẫn là `.5-r1` dù đã có đổi rules; phải khảo sát replay thực trước khi tuyên bố giữ được mọi save R1.
- File: plan này, `docs/reports/R4_BASELINE.md` dự kiến; đọc `content`, `persistence`, `core/processor`, `client/audio`.
- Gate: biết đoạn nào rút ngắn game, biết vấn đề audio thuộc code/mix/trạng thái trình duyệt; có plan slice đủ để Sol triển khai. Không đặt kết quả fun từ số test.

### R4.1 — thám hiểm địa điểm và lựa chọn có hậu quả

- Sol: module expedition/scenario cho graph điểm tương tác, phân công crew, trạng thái mục tiêu, cảnh giới và rút lui; tạo scenario chợ bằng data/schema. Tiếp tục command validation nguyên tử.
- File dự kiến: `src/expedition/`, `src/core/commands.ts`, `state-schema.ts`, `events.ts`, `processor.ts`, `src/content/`, client scene mới trong `src/client/components/`.
- Chốt thang thời gian mới trước cân supplies: travel giờ, hành động hiện trường phút hoặc mission budget; không để một lần mở tủ/đánh tự đốt một giờ như rules cũ. Tránh đồng hồ chạy ngoài command. Chỉ áp dụng rules mới trong bundle mới.
- Terra: kiểm tra deterministic, crew vắng/downed, loot/capacity, rút lui, save giữa nhiệm vụ, invalid commands và đường kết thúc thay thế.
- Astral review: ít nhất hai cách giải nhiệm vụ khả thi; ít nhất ba hậu quả được nhìn thấy ở checkpoint tiếp theo; không cần sửa engine theo ID của riêng chợ.

### R4.2 — combat mục tiêu và build

- Sol: vị trí/AP, tương tác môi trường, objective win/loss, ý đồ có counterplay, 3 vai trò địch và 2 module xe; giữ lựa chọn nghi binh/thoát.
- File: `src/combat/`, `src/read-models/`, content skill/encounter/scenario và `CombatPanel`/scene.
- Terra: mục tiêu sống/chết/rút, target/range/AP không hợp lệ, địch chết/downed/capture, chuyển loot/ownership, save/replay và tránh softlock khi mất người cần thiết.
- Astral review: chơi thắng bằng hơn một chiến thuật; vị trí/skill/module đổi cách giải tình huống; không dùng tăng HP làm nội dung chính.

### R4.3 — trình diễn có thể cảm nhận

- Sol: scene animation timeline, nhạc/ambience/SFX có assets, mixer/unlock, reduced motion; registry hỗ trợ media có metadata và fallback. Voice/clip placeholder có thể dùng để thử timing nhưng phải ghi rõ chưa phải media cuối.
- File: `src/client/audio.ts`, client presentation/scene, `src/client/art/`, CSS, pipeline media riêng dưới `scripts/` khi cần. Core chỉ phát event/ID ổn định.
- Terra: nghe thật sau click mở đầu, tab background/resume, mute/volume, lỗi asset, trình duyệt/mobile; xác nhận từng reaction, skip và chơi khi tắt media.
- Gate: người chơi nhận ra ai làm gì và mất/được gì không cần đọc log; nhạc/thoại không lấn tín hiệu gameplay.

### R4.4 — kiểm chứng sức hút rồi mở rộng

- Mời tối thiểu 5 người chưa biết đường giải chơi slice; ghi thời gian chủ động, bỏ cuộc, thao tác không hiểu và ba quyết định họ nhớ. Đây là mẫu formative nhỏ, không phải thống kê thị trường.
- Gate thử nghiệm: ít nhất 4/5 hoàn thành mà không cần hướng dẫn miệng; ít nhất 3/5 tự nguyện chọn chơi chặng tiếp; quan sát có ít nhất hai chiến lược khác nhau; phần lớn người chơi nêu được một đánh đổi có ý nghĩa. Thời gian mục tiêu 20–30 phút nhưng không đạt bằng cách ép chờ.
- Nếu chưa đạt: Astral sửa giả thuyết/plan, Sol sửa gameplay, Terra kiểm tra phần đổi; chưa đổ tiền vào nhiều cinematic hoặc nhân bản ba hồi.
- Khi đạt: mở rộng 2 hồi còn lại theo bảng thời lượng, thêm các tình huống thay thế, rồi làm thoại/clip cuối. Mỗi hồi có plan content và gate riêng trước code.

## 8. Compatibility, đo lường và giao hàng

- Đóng băng bundle/rules đã phát hành sau audit; R4 dùng content version mới và save namespace riêng. Nếu state cần cấu trúc mới, bump schema và định nghĩa migration rõ, không sửa version cũ để qua fixture.
- Giữ `.4`, snapshot hiện tại và fixtures thật. Không hứa migrate chuyến đang dở sang luật mới nếu replay không tương đương; vẫn có đường mở chuyến legacy.
- Lượt chơi dài hơn cần đo serialize/replay cost trước tối ưu snapshot. Không đưa cloud server hoặc AI runtime vào phạm vi này.
- Telemetry local/opt-in: thời gian hoạt động, điểm bỏ cuộc, objective đạt, route, kỹ năng dùng và hậu quả; tách thời gian phim/đọc/đợi. Không dùng dữ liệu cá nhân hay nhận diện người chơi.
- QA sau khi được giao triển khai: core/content tests theo thay đổi; scenario bot cho đường thắng/thua/thoát và invalid commands; browser/mobile/audio/human playtest. Bot chỉ xác minh logic, không chấm sự thú vị.
- Mỗi bước cập nhật HANDOFF/PROGRESS, report, commit rõ trạng thái. Chưa triển khai hoặc chi tiền chỉ vì tài liệu này tồn tại.

## 9. Chưa làm trong R4 slice

Online multiplayer, open world, hàng trăm event, mô phỏng quan hệ sâu, full 3D, AI hội thoại runtime, lồng tiếng mọi dòng và phim dài. Có thể xem xét sau khi vòng chơi nhỏ chứng minh được giá trị.

## 10. Trạng thái công việc

- [x] Terra đọc source và báo bằng chứng, không chạy QA.
- [x] Terra nghiên cứu Google; Astral đối chiếu lại nguồn, loại bỏ giá Veo Developer API đã ngừng.
- [x] Astral đề xuất cấu trúc, slice, phương án media và gates.
- [ ] Người dùng chọn hướng/phạm vi triển khai tiếp.
- [ ] R4.0–R4.4: chưa bắt đầu triển khai.

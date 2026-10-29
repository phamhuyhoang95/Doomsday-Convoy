# Ảnh, âm thanh và animation cho đợt đại tu Argon

**Checkpoint sản xuất 2026-10-29:** Đã tạo/tích hợp atlas 5 actor × 2 pose, nền chợ và nhạc combat Gemini qua tài khoản Google hiện có; không bật API billing/mua credits. Master, prompt, nguồn và hash tại `art/argon-o1/`. Audio loop ~76s, mix riêng; SFX/ambience vẫn Web Audio. Technical QA đạt, duyệt thẩm mỹ/điểm nối nhạc còn mở; chưa có voice/video. [Báo cáo O1](../reports/ARGON_O1_IMPLEMENTATION.md). Các phần chưa sản xuất bên dưới là trạng thái khi lập plan.

**Ngày:** 2026-10-29. **Trạng thái:** phương án sản xuất/tích hợp, chưa tạo media hoặc sửa client. Liên quan: [plan đại tu](../plans/ARGON_COMBAT_UI_OVERHAUL.md), [review](../reports/CONCEPT_REDESIGN_REVIEW.md), [pipeline A1/A2](ASSET_PIPELINE.md).

**Nguồn sản xuất được người dùng nhắc lại:** Người dùng vẫn có Google AI Pro. Ưu tiên tận dụng quyền tạo nhạc trong Gemini và video trong Flow trên tài khoản này trước khi đề xuất API hoặc thuê dịch vụ khác. Google Help xác nhận [Gemini có thể tạo/tải nhạc bằng Lyria](https://support.google.com/gemini/answer/16901237?hl=en); [Flow Help](https://support.google.com/flow/answer/16526234?hl=en) hiện liệt kê Pro thêm 1.000 Flow credits/tháng. Đây là quyền lợi công khai đã tra ngày 2026-10-29, chưa phải số dư/tính năng đã kiểm tra trong tài khoản người dùng. Không coi lời nhắc có Pro là lệnh tạo media, tiêu credit hoặc bật billing ngay.

Phương án ưu tiên: chuẩn bị prompt cho 4 mood nhạc và shot list ngắn, tạo batch thử trên Gemini/Flow khi bắt đầu sản xuất, tải file gốc vào workspace rồi biên tập loop/encode/tích hợp. Ảnh/sprite vẫn theo pipeline đã chọn; animation gameplay dựng từ state/events. Voice Việt và SFX chuyên biệt chọn nguồn riêng nếu quyền tạo nhạc/video không đáp ứng; không mặc định AI Pro bao gồm mọi API/TTS. Việc tools phiên này không có audio/video generator chuyên dụng không phủ định khả năng sử dụng web app Google sẵn có; cần kiểm tra phiên đăng nhập/quyền thực tế khi thao tác.

## 1. Phạm vi đợt đại tu

Người dùng hỏi khả năng đáp ứng toàn bộ Argon và ảnh/âm thanh/animation có nằm trong đợt này hay không. Đề xuất đưa **art phục vụ UI mới, animation chiến đấu/di chuyển, hiệu ứng môi trường và audio gameplay** vào acceptance cùng combat/UI; không đẩy tất cả thành một đợt polish chưa xác định.

Thoại chọn lọc và clip điện ảnh là phần mở rộng có điều kiện nguồn sản xuất. Full voice-over mọi event, lip-sync, chuyển động nhân vật vẽ từng frame hoặc rig xương hoàn chỉnh chưa được tính vào gói mặc định. Animation đích của gói cơ sở là 2D nhiều pose và hiệu ứng có chiều sâu theo nhịp combat; cần xem mẫu thật để đánh giá đạt chất lượng concept.

Đây là đề xuất cụ thể để triển khai tiếp theo, không phải media đã có hoặc xác nhận đã dùng dịch vụ trả phí. Không gọi API/bật billing từ yêu cầu trao đổi phương án.

## 2. Hiện trạng đã đối chiếu

- Catalog A2: 38 mappings/29 ảnh web; có nền/portrait/icon/2 xe alpha. Chưa có bộ full-body chiến đấu cùng hướng/pose cho các phe.
- `src/client/audio.ts`: Web Audio oscillator/noise/drone, nhịp BGM tổng hợp cho menu/road/combat, các cue đánh/hồi máu/chuông/nhịp tim; một mute/volume chung. Playback hiện chọn một cue chính từ report, chưa phải score/SFX nhiều lớp theo từng beat.
- Lệnh `/usr/bin/find public art` với đuôi mp3/ogg/wav/webm/mp4 và tên atlas/sprite không trả file phù hợp trong hai thư mục đó. Không suy rộng thành kết luận toàn ổ đĩa không có media.
- Công cụ hiện có trong phiên hỗ trợ tạo/edit ảnh raster và code/tích hợp asset. Không tìm thấy công cụ tạo nhạc/voice/video chuyên dụng qua metadata tools hiện bật; không hứa sẽ tự tạo các file đó bằng imagegen.
- [GOOGLE_MEDIA_PRODUCTION](GOOGLE_MEDIA_PRODUCTION.md) là đề xuất lịch sử, chưa phải asset hoặc quyền truy cập/billing đã xác minh. Phiên này không xác nhận lại bảng giá/credit/model video và không dùng các số đó làm dự toán mới.

## 3. Sản phẩm media đề nghị

| Nhóm | Phần đưa vào đợt đại tu | Cách làm |
|---|---|---|
| **Art nhân vật** | Full-body các phe, identity thống nhất với portrait, hướng nhìn/cỡ người/điểm chân và ánh sáng khớp stage | Chốt character sheet; gen một mẫu và thử trong cảnh trước; sau đó tạo pose set theo manifest. Giữ alpha thật và PNG master. |
| **Nền và xe** | Combat stage, event/scene chính, map, cabin và map ẩn khi cơ chế tương ứng có mặt | Tái dùng A2 phù hợp, chỉnh/thay từng asset lệch phong cách; nền sạch UI; xe/cảnh cùng camera. Không gen lại toàn catalog. |
| **UI art** | Icon skill/status/pathway/kỳ vật, khung kim loại cũ, vật liệu nhỏ | Vector/CSS cho hình khối và frame co giãn; raster cho minh họa/texture. Chữ/nút/meter không baked-in. |
| **Combat animation** | Idle nhẹ, chuẩn bị/ra đòn, cast, hit/recoil, guard/heal, gục; combo/xe/kỳ vật có hiệu ứng nhận diện | Pose switching + transform/mask/particles + timeline theo domain events. Không chỉ rung cả màn và đổi số. |
| **World/scene animation** | Xe chạy tuyến/đèn pha, sương/mưa/tro, hotspot, mở lối ẩn, chuyển cảnh, sự kiện chuông | Chuyển động nhiều lớp, tiết chế quanh vùng đọc; projection của map/scene đồng bộ điểm tương tác. |
| **SFX** | UI, vũ khí/va chạm, guard/heal/skill, xe/máy/radio, chuông/tha hóa, loot/victory/defeat | SFX tổng hợp cho lớp đơn giản; file được phép sử dụng cho chất âm cụ thể. Cue trùng nhịp impact/status, có giới hạn số nguồn cùng phát. |
| **Ambience/nhạc** | Không khí theo địa điểm và nhạc exploration/combat/anomaly/ending; chuyển mood mượt | Audio files đã biên tập loop + crossfade, trộn tách music/ambience/SFX. Web Audio tổng hợp làm lớp phụ/fallback, không mặc định coi đã có soundtrack hoàn chỉnh. |
| **Voice chọn lọc** | Radio, cảnh báo, phản ứng nhân vật và vài câu then chốt | Soạn text key/subtitle, audition giọng Việt trước khi batch; không đọc mọi đoạn event. Có điều kiện nguồn TTS/thu âm. |
| **Clip điện ảnh** | Có thể thêm một số mở đầu/cao trào ngắn sau khi vòng chơi đã tốt | Offline video tùy chọn, skip/fallback; không dùng video thay cảnh chiến đấu tương tác. Chưa thuộc gate bắt buộc. |

### Quy mô batch đầu và mở rộng

Các số sau là **mốc dự kiến để lập manifest**, không phải output đã sản xuất hoặc cam kết toàn campaign chỉ cần bấy nhiêu:

- O1: 3 crew và 2 địch cho một trận thật; một combat stage và xe hỗ trợ; icon cho kỹ năng/status thực sự dùng. Mỗi actor thử các pose idle/action/hit/downed, có thể cần pose riêng theo vũ khí. Khóa mẫu identity/alpha trước khi nhân rộng.
- Roster nền mở rộng: 4 crew + 2 cướp chợ + 2 Tro Tàn = 8 nhân vật cơ sở; boss/tiên phong/nhân vật mới trong Argon bổ sung theo encounter. 4 pose cho 8 actor tương đương khoảng 32 pose được chọn, **không phải** cam kết 32 lần gen là đủ hoặc bắt buộc từng pose là một lần gen độc lập.
- O1 audio: khoảng 10–15 cue SFX thiết yếu, một ambience và một combat music loop có nguồn thật; nếu chưa có nguồn cuối thì có thể dựng kỹ thuật bằng âm tạm nhưng phải ghi visual/audio acceptance còn mở.
- Gói đại tu cơ sở: dự kiến 25–40 cue SFX, 4–6 ambience, 4 mood nhạc và 3 stinger vào trận/thắng/thua. Điều chỉnh sau inventory và nghe thử, không sản xuất hàng loạt khi chưa biết những cue nào cần thiết.
- Voice tùy chọn: bắt đầu 6–10 câu audition/chủ chốt, mở rộng khoảng 20–30 câu được chọn nếu giọng/ngân sách phù hợp. Clip chưa có chỉ tiêu bắt buộc.

## 4. Công nghệ và đồng bộ

**Làm rõ trao đổi về framework:** không cần chuyển sang một game engine mới để có combat theo lượt. Tuy nhiên, đủ toàn bộ yêu cầu shader trong Argon khác với chỉ có layout/animation DOM. Phương án kỹ thuật đề nghị cho full effects là React cho HUD/text/control, PixiJS cho stage/particles/distortion khi mẫu chứng minh đạt mục tiêu, và một sequencer điều phối animation/audio. Không cần cài thêm Motion/Zustand/Howler cùng lúc nếu client không có nhu cầu riêng.

Pixi hỗ trợ filter hậu kỳ và custom shader; các filter này có chi phí GPU, cần quality tier và thử trên mobile. Nguồn chính thức đối chiếu ngày 2026-10-29: [filters](https://pixijs.com/8.x/guides/components/filters), [scene objects và chi phí filters](https://pixijs.com/8.x/guides/components/scene-objects). CSS/SVG vẫn dùng cho HUD, đường map hoặc hiệu ứng đơn giản phù hợp. Chốt renderer trước batch production sau mẫu kỹ thuật nhỏ; không viện lý do “React đủ” để bỏ shader đã thống nhất.

Mỗi command hợp lệ cập nhật authoritative state và autosave ngay. Sequencer dùng thứ tự event, actor/target ID và event ID: wind-up → action → impact/SFX → status/HP → recovery. Không gọi engine lại hoặc dùng RNG gameplay để chọn biến thể âm/particles. Skip/reduced motion vẫn kết thúc ở cùng state; mute/clip lỗi không khóa game. Cancel/unmount/load/menu phải dọn animation/audio và bỏ queue cũ.

Audio director mới có master/music/ambience/SFX/voice, duck music khi thoại/chuông quan trọng, preload cue của cảnh sắp tới và pause/suspend khi tab ẩn. Web Audio có thể phát/trộn file và xử lý gain/pan; cần unlock từ thao tác người dùng vì autoplay policy. Nguồn: [MDN Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API), [autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay). Howler là lựa chọn adapter nếu cần, không phải điều kiện có âm thanh tốt.

## 5. Nguồn sản xuất và giới hạn thực tế

- **Ảnh:** có thể dùng công cụ imagegen hiện có khi bắt đầu sản xuất; tuân skill imagegen và pipeline/receipts. AI không tự bảo đảm pose/identity/alpha đạt ngay; xem từng mẫu và giữ revisions.
- **Âm đơn giản:** có thể code/synthesize tại client hoặc render offline; phù hợp UI/noise/heartbeat/drone và một số hiệu ứng. Chất âm súng/động cơ/nhạc giàu nhạc cụ cần file phù hợp, không hứa vài oscillator đạt chất lượng điện ảnh.
- **SFX/nhạc hoàn thiện:** chọn nguồn file có quyền dùng/phát hành hoặc dịch vụ sản xuất khi được giao; lưu nguồn/license/attribution và bản gốc. Tự xây loader/mixer không tạo ra các bản thu còn thiếu.
- **Voice Việt:** Cloud TTS hiện có vi-VN, gồm Chirp 3 HD và các dòng giọng khác, theo [danh sách chính thức](https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types?hl=en). Khả năng dịch vụ không đồng nghĩa phiên này đã có quyền gọi tài khoản. Chưa chọn voice/model, chưa xác nhận quota/billing và chưa gọi tạo thoại.
- **Video:** giữ phương án Google/Flow lịch sử làm đầu vào; kiểm tra công cụ/tài khoản/chi phí hiện hành khi thực sự chọn sản xuất. Không mặc định subscription/Cloud credit chi trả được mọi dịch vụ.

Asset media được tạo offline, đóng gói local theo cảnh; game không cần gọi generative API trong lúc chơi. Không đưa API key vào client. Dự toán tiền cụ thể để sau khi chốt nguồn và số lượng, không coi việc viết plan là cho phép tiêu ngân sách.

## 6. Pipeline và acceptance

1. Chốt style/motion/audio brief và các beat của trận O1; inventory A2, mapping từng asset giữ/chỉnh/thay/mới. Concept 7 JPG là reference, không phải ảnh runtime có nút trong suốt.
2. Dựng một mẫu art trong stage và một câu nhạc/âm thử để đánh giá trực tiếp. Khóa tỷ lệ người/xe, chân tiếp đất, hướng sáng, readability và âm lượng trước batch tiếp.
3. Lưu ID, nguồn/prompt/model/voice nếu có, revision, trạng thái chọn, transcript, duration/dimensions, license và chi phí thực nếu có trong manifest/receipts. Master và bản web tách riêng; không dùng output tạm ngoài workspace làm nguồn duy nhất.
4. Encode/tải theo cảnh; atlas/texture budget nếu dùng Pixi; nhạc/voice tải lười; fallback ảnh/text/âm cơ bản. Không tải toàn bộ campaign lúc mở menu.
5. Nối vào registry, sequencer và audio director; kiểm tra beat đồng bộ hình/âm chứ không phát một cue chung cho cả transaction nhiều đòn.
6. QA khi được triển khai: desktop/mobile, lỗi ảnh/âm/WebGL, audio unlock, mute/volume, tab ẩn/load/skip, reduced motion, clip/subtitle, không clipping/điểm nối nhạc bật tiếng, không che thoại/đối thoại cần hiểu.

O1 chỉ đạt media acceptance khi trận dùng asset đã chọn và âm đủ đại diện; file tồn tại/API thành công không chứng minh chất lượng. Chỉ kết luận bám concept sau xem ảnh/video gameplay thật, nghe mix thật và kiểm tra thao tác. Không hứa animation vẽ từng frame hoặc 60 FPS trên mọi thiết bị.

## 7. Checkpoint

Phiên này đọc docs/source/asset inventory và tra tài liệu chính thức về filters, Web Audio/autoplay, voice Việt. Chưa gen, tải stock media, gọi dịch vụ trả phí, cài package, sửa client hoặc chạy test/build/validator/simulation/browser QA. Cần quyết định nguồn soundtrack/SFX hoàn thiện khi bắt đầu sản xuất; việc này không chặn chuẩn hóa rules, layout, sequencer và audio mixer.

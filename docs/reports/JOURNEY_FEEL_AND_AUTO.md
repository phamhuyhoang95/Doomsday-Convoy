# Chuyển cảnh hành trình, auto combat và lựa chọn nối dài

2026-10-29; baseline `26ef77f`; implementation `da38847` đã push `origin/main` và đối chiếu SHA remote. Phản hồi: combat đã ổn hơn nhưng travel nhảy đột ngột, nội dung cụt/dễ đoán, muốn auto để rảnh tay. Đã triển khai theo [plan](../plans/JOURNEY_FEEL_AND_AUTO.md). Đây là một đợt cải thiện cảm giác chơi và slice nội dung, chưa phải hoàn tất O2–O4.

## Chức năng

- Travel có clip **5.208 giây, H.264 1280×720/24fps, 714592 bytes**: xe rời điểm đỗ, nền pan, rung nhẹ, grain/vignette/fade, tiếng máy, tên hai nơi và thời gian thật. State/autosave hoàn tất trước phim; UI phía dưới inert, không dispatch thêm lệnh. Skip/Esc, tự kết thúc, timeout 6 giây, lỗi video dùng chuyển động CSS, reduced motion bỏ phim. Sau đó về scene tại nơi tới.
- Clip là **motion composition từ bus alpha + nền trạm dịch vụ A2**, dựng offline bằng ffmpeg; không gọi là AI video hay cinematic quay/hoạt họa đầy đủ. Hiện dùng một shot chung cho các tuyến; bánh xe/nhân vật không có animation độc lập. Không dùng Google credits trong đợt này. Giữ art gốc, script và receipt có SHA/bytes.
- Nút **AUTO** mặc định tắt, hiện trong tactical combat. Chọn command thật: cứu người dưới 45% HP, sửa xe dưới 35%, khai thác combo/đánh thường, guard khi không có đòn hợp lệ. Dành kỳ vật/hỗ trợ tiêu xăng cho quyết định thủ công; giữ dự trữ scrap cho đòn tấn công. Chờ animation xong và 850ms trước lượt tiếp, chỉ một command mỗi trạng thái.
- Auto dừng khi tắt/chạm thao tác/Esc/ẩn tab/load/menu/đổi trận/aftermath; không tự bắt giữ, finish, surrender, retreat hoặc giải quyết sự kiện. New session key khi load kể cả cùng seed/battle ID; timer cũ được cleanup.
- Bundle **`0.2.0-campaign.2-journey`** có **16 events**, thêm 4 event/14 choice authored xuyên gara → chợ → điểm dừng tiếp → checkpoint. Radio scan mở cách đối chất không mất thuốc; Lan có thể thử mẫu; thông tin mở phương án khử nước; nhận nước chưa xử lý dẫn tới vấn đề ở chặng sau. Hậu quả có thuốc/nước/HP thật và hồi đáp ở checkpoint tùy lịch sử. Có free fallback và nhánh bỏ qua arc.
- Raw-water problem xuất hiện ở điểm dừng kế tiếp, khóa travel tiếp đến khi giải quyết để không né hậu quả bằng cách bỏ dialog mở. Điều kiện travel ghép thêm vào điều kiện destination cũ; không đổi các luật của bundle cũ.
- UI không còn đưa toàn bộ mô tả manh mối chưa khám phá vào lý do khóa lựa chọn. Event nhiều địa điểm fallback art theo nơi hiện tại thay vì vẽ nhầm gara.

## Compatibility và file chính

Giữ nguyên bundle Argon O1, R1/.4; engine/save/state vẫn `0.1.0`/v3. New game dùng Journey và slots `journey-autosave`/`journey-manual`; nút **Tải Argon O1** mở autosave `argon-autosave` bằng luật O1. Save đang chơi vẫn lưu theo bundle của nó. Không migrate ngầm, không ghi đè slot O1.

- `src/content/journey.ts`, registry; validators/CLI nhận `--content journey`.
- `src/read-models/auto-combat.ts`: policy thuần, không RNG/mutation.
- `src/client/argon/{use-auto-combat,use-travel,TravelCinematic}.tsx/ts`, CombatStage/App/use-game/audio/CSS: scheduler, khóa/cancel, phim/âm thanh.
- `src/narrative/read-model.ts`: lý do khóa chỉ dùng knowledge được phép hiển thị.
- `tests/journey.test.ts`: 9 tests mới về arc, ownership bundle/replay, atomic travel rejection, revive và auto qua 3 seed.
- [Clip receipt](../../art/journey/clip-receipt.json), [script dựng](../../scripts/build-journey-clip.py), [MP4](../../public/video/journey/convoy-departure.mp4).

## Gate thật

Runtime Node **24.14.0**, macOS; diff kể từ `26ef77f`. Không dùng số liệu O1 thay cho đợt này.

| Kiểm chứng | Kết quả |
|---|---|
| `npm run check` cuối | World/content 3 bundles/art A2 validators pass; **129 tests/8 files** pass, Vitest **13.47s**; strict TS + production build pass, Vite **14.33s** |
| `npm test -- tests/journey.test.ts` | 9/9 pass, 2.13s; sau thêm nhánh bản thu radio |
| `npm run simulate:campaign -- --content journey --seeds 6 --output artifacts/journey-simulation.json` | **48 runs**, 36 thắng/12 thua chủ đích starvation/hazard, **0 softlock/0 rejected**, 48 save/load và 48 replay, issues=[] |
| ffprobe / hash receipt | H.264, 1280×720, 24fps, 5.208333s; 4 input/output files đúng hash/bytes, A2 không đổi |
| `git diff --check` | Pass trước checkpoint |

Browser IAB, origin QA **127.0.0.1:5180**, không ghi save cá nhân ở 5173/4173:

- Desktop **1280×720**, mobile **390×844**. Lựa chọn dài nằm trong chiều ngang 390; combat mobile có scroll dọc ngắn (~35px), CTA tiếp cận được; không chứng nhận thiết bị thật.
- Video: đã chờ DOM `data-playback=playing`, đọc video **paused=false, readyState=4**, currentTime đang tăng từ đầu shot. Skip về đúng chợ, clock/resources thật; một chuyến khác tự về trạm dịch vụ khi phim kết thúc.
- Tạm di chuyển MP4 ra ngoài web, reload rồi travel: source lỗi chuyển CSS fallback, skip vẫn tới nơi. Đã khôi phục file và xác minh hash. Không phát sinh lệnh gameplay khi bỏ phim.
- Auto: bật và để chơi thắng tới aftermath, nút tự về OFF; không tự capture/finish. Bật/tắt giữa trận; save → auto ON → load khôi phục replay và AUTO OFF. Sau sửa thêm bar, grid dùng đủ 3 hàng để không đẩy console khỏi viewport desktop.
- Điều tra: nút khử nước bị khóa không còn lộ “sợi đen”; thử mẫu tiêu 1 thuốc, text/knowledge đổi và nút khử nước mở. Mobile các choice rect trái/phải 35/355 trong viewport 390.
- Reduced motion và ẩn tab có nhánh xử lý trong code; chưa thử đổi setting hệ điều hành/thiết bị thực. Chưa nghe mix tiếng máy qua nhiều thiết bị hoặc đo FPS.

Ảnh: [travel desktop](../../artifacts/journey-travel-desktop.jpg), [travel mobile](../../artifacts/journey-travel-mobile.jpg), [video lỗi](../../artifacts/journey-travel-fallback.jpg), [auto desktop](../../artifacts/journey-auto-desktop.jpg), [auto mobile](../../artifacts/journey-auto-mobile.jpg), [điều tra](../../artifacts/journey-investigation-desktop.jpg), [điều tra mobile](../../artifacts/journey-investigation-mobile.jpg); [simulation](../../artifacts/journey-simulation.json).

## Findings đã sửa

| Mức / vị trí | Trigger, hậu quả và cách xác nhận |
|---|---|
| P1 — narrative/read-model.ts | Lý do thiếu knowledge in nguyên mô tả fact, làm lộ đáp án. Đổi sang lý do điều tra chung; test và UI xác nhận chưa lộ trước khi kiểm mẫu |
| P1 — App/use-game/use-auto-combat | Load cùng battle ID có thể giữ timer auto. Remount theo session mỗi lần load; UI save/ON/load chứng minh OFF và giữ nguyên lượt đã lưu |
| P2 — TravelCinematic source | Source tải lỗi không bảo đảm video nhận error. Thêm source onError; thử 404 thật đã vào fallback và thoát được |
| P2 — argon.css | Thêm auto bar tạo hàng grid ngầm lớn, đẩy action console xuống. Thêm class with-auto + 3 hàng rõ; ảnh 1280×720 có CTA |
| P2 — journey content/travel requirements | Ban đầu dùng route ID làm key trong khi schema dùng destination ID. Validator bắt lỗi; đã sửa theo API thật, không nới validator |

## Cách thử và giới hạn

Dùng Node 24, `npm run dev`; chọn hành trình mới. Sau chuẩn bị gara, xử lý radio rồi đi chợ để gặp arc mới. Save O1 tiếp tục bằng nút riêng và không tự nhận content mới.

QA dev: `?qa=map` rồi mở bản đồ/lên đường; `?qa=combat` để thử AUTO; `?qa=water` để thử điều tra; `?qa=consequence` để xem hậu quả ở chặng sau. Query không dựng state trong production.

Game vẫn còn các sự kiện cũ ngắn và các màn quản lý/nhiệm vụ chưa làm lại sâu. Một clip dùng chung và một arc mới chưa giải quyết hết độ hấp dẫn/replay value. Cần human playtest để đánh giá nhịp 5 giây có lặp hay không; bước tiếp là mở rộng encounter nhiều giai đoạn, vai trò crew/động cơ nhân vật và hậu quả qua nhiều nơi theo từng slice, cùng shot video riêng cho các vùng khi nguồn media phù hợp. Build còn cảnh báo chunks >500k (main ~612kB/Pixi ~902kB) và zod annotation như trước.

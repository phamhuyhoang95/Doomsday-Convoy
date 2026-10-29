# Resonance — chương truyện, siêu phàm và Flow

2026-10-29. Baseline `94cbfbe`; đợt này mở rộng đúng yêu cầu tiếp tục về màn chơi/lore/pathway và cinematic dùng ảnh game. Đây là một slice đã có chức năng, chưa nghiệm thu toàn bộ Argon hoặc cân bằng bằng playtest.

## Chức năng thật

- Ba chương trên **8 địa điểm hiện hữu**, có câu hỏi, mục tiêu tự cập nhật và hồ sơ điều tra. Sáu event mới đưa tổng số event lên 22. Không tạo map mới hoặc giả lập lựa chọn bằng React.
- Canon [Hồi Chuông Số Không](../game/LORE_BIBLE.md): Đối Âm, Phía Vọng, cơ chế tên/nhịp/vật chứng; game chỉ công bố 6 hồ sơ khi đã thu bằng hành động. Phân biệt lời chứng, đối chiếu và giả thuyết. Đến Bắc Sơn vẫn là kết thúc chặng, chưa có màn phá lõi hay ending mới về chân lý.
- Màn **SIÊU PHÀM**: 4 con đường × 3 bậc 9→8→7, 12 kỹ năng (10 ID mới và 2 ID có luật mới chỉ trong bundle mới). Nghi thức dùng command thật, 0 giờ, trừ XP khả dụng/di vật/vật tư; XP tích lũy và điểm huấn luyện giữ nguyên. Bậc cao đòi hồ sơ Thánh An/Bắc Sơn; không đổi/lai ngạch trong slice này.
- Operator chung có hồi sinh/cầm máu/cường hóa khi cầm bleed, giáp chắn/phản 50%, dùng thi thể địch, phá giáp/choáng seeded RNG, đổi chỗ/né, xe sửa+húc và pháo đài hữu hạn, đảo sát thương thành hồi phục có trần. Người Nghe Chuông giảm 75% rủi ro còn lại sau recon, không cộng dồn giữa nhiều người. Chưa có thanh tha hóa/ethos hay thăng bậc 6→0.
- Clip mở đầu Flow thật 8.042s, 1280×720, AAC stereo; dùng **vehicle.bus.png + market-stage.jpg** làm tham chiếu. Master 6.15 MB; bản web ~2.82 MB, giữ watermark Flow. New game phát mở đầu, menu có xem lại; skip/ESC/timeout/fallback ảnh, hỗ trợ nhánh reduced-motion. Phim không thay state/tick/RNG; autosave khởi tạo trước khi phát.
- Travel vẫn dùng shot composition Journey cũ; chưa thay tất cả chuyển chặng bằng Flow. Chưa có bộ cinematic riêng cho từng chương. Không hứa đã đạt chính xác nhịp phản chiếu trễ nửa giây; chuyển động/xe/palette đã xem khung 1s và 6s, audio giữ stream nhưng còn cần người nghe duyệt mix.

## Source và compatibility

Bundle **`0.3.0-campaign.1-resonance`**, slots `resonance-*`. Giữ Journey `.2-journey`/`journey-*`, O1 `.1-argon`, R1 `.5-r1`, archive `.4`; nút tải Journey cũ riêng. State/save v3 và engine 0.1.0 giữ nguyên; optional `actor.pathway`, `campaign.occultRemnants`, `tactics.vehicleWard`. Không migrate ngầm hoặc đổi source bundle cũ.

- `src/content/resonance.ts`, `pathways.ts`: nội dung, gates và 12 ability.
- `src/occult/`: schema/preview/command thăng bậc; `src/combat/tactical-*`: operator và lifecycle.
- `src/read-models/campaign.ts`: chương/hồ sơ; `src/client/argon/PathwaysScreen.tsx`, `LoreScreen.tsx`, `OpeningCinematic.tsx`: presentation/dispatch.
- `art/flow-cinematics/`: master, prompt, receipt/hash/reference/model/chi phí; `public/video/resonance/`: bản web/poster; `scripts/prepare-flow-opening.py`: chỉ encode master local, không gọi API.

Flow UI hiển thị **Omni 1.1 Flash**, không gọi nhầm thành Veo. Đã duyệt hai output (thử text-only + bản hai ảnh), mỗi output báo 12 credits: tổng duyệt 24; không xác minh biến động số dư. Không mua/top-up hoặc bật billing. Người dùng đồng ý hộp quyền dùng ảnh trước khi bấm; công cụ không nhận được download, người dùng đã lưu bản 720p vào workspace, sau đó agent encode và tích hợp.

## Gate và giới hạn thật

Runtime Node **24.14.0**; diff làm việc dựa `94cbfbe`.

| Lệnh / kiểm chứng | Kết quả |
|---|---|
| **`npm run check` cuối** | **PASS: validators + 146/146 tests (9 files), strict TS và production build**. Vitest8.93s, Vite9.62s. Không tăng timeout hoặc thay fixture. |
| `npm run check` sớm trong phiên | World/content/art validators pass; 140/142 tests pass, 2 timeout; command không tới build ở lượt này. Lượt cuối ở trên thay thế trạng thái gate này. |
| `npm test -- --maxWorkers=1` sớm trong phiên | 139/142 pass, 3 timeout; không có assertion sai ở các ca hoàn tất. 227.59s. Không thay timeout/fixtures để che lỗi. |
| `npm test -- tests/resonance.test.ts` sau bổ sung | **17/17 pass**, lượt cuối cũng nằm trong full146tests. Atomic rejection, ownership/knowledge/cost, XP/points, tier7 qua hành động thật, save/replay, passive, combat/status/RNG/preview/auto; sửa+húc dùng được cả khi xe đầy trong khi sửa thường vẫn khóa. |
| `npm run validate:content` cuối | 4 bundles hiện hành valid; Resonance 22 event/18 tactical ability. |
| `npm run build` | Strict TS + Vite production build pass, gồm bản cuối có media local đã bật. Có cảnh báo chunk lớn/annotation Zod, không phải lỗi build. |
| `npm run simulate:campaign -- --content resonance --seeds 6 --output artifacts/resonance-simulation.json` | **48 runs: 36 thắng, 12 thua chủ đích; 0 softlock/rejected; 48 save/load và replay khớp**. Bot không tự thăng bậc; test riêng kiểm tra progression/skill. |

Ba timeout ở lượt tuần tự: campaign đa kết cục (5s), campaign64runs (30s), foundation100runs (5s). Đã đối chiếu đúng ca foundation trên bản nền `94cbfbe` ở `/tmp/gameol-baseline-94cbfbe` cùng Node/dependencies: **cũng timeout**, body10.352s / tổng20.53s. Đây là bằng chứng vấn đề không chỉ có ở source mới, chưa chứng minh mọi khác biệt hiệu năng đã được loại trừ. Sau khi thời gian thực thi trở lại bình thường, lượt cuối full check đã pass146tests mà không đổi timeout. Giữ lịch sử này để phân biệt lỗi môi trường với lỗi assertion; không cần chạy lại batch lớn khi không có thay đổi liên quan.

Browser QA origin riêng **127.0.0.1:5180**, không ghi save cá nhân 5173/4173:

- Minh thức tỉnh Người Nghe Chuông: giờ03:00 không đổi, XP khả dụng10→0, di vật3→2, thuốc8→7, phế liệu12→11; khóa chuyển ngạch và bậc8 thiếu hồ sơ. Lưu/tải qua UI giữ đúng con đường, có thông báo xác minh replay.
- Hồ sơ: 1/6 đã mở, 5 bản còn ẩn cả tiêu đề/body; ba chương và checklist hiện đúng. Mobile390×844 không tràn ngang ở hồ sơ/pathway.
- QA combat dùng command thật để thức tỉnh cả đoàn; Bước Nhảy Phản Chiếu đổi Minh/Lan thật, trạng thái né xuất hiện, không trôi giờ, không có console error khi kiểm tra.
- Clip source local được phát với `paused=false`, `readyState=4`; kiểm tra mute=true khi tắt âm thanh, skip đóng dialog, tự trở lại menu/scene, 404 vẫn fallback và thoát được. Mobile có nút bỏ qua, không tràn ngang. Chưa QA reduced-motion cấp hệ điều hành/thiết bị thật hoặc duyệt chất lượng audio bằng người nghe.

Ảnh: `artifacts/resonance-opening-desktop.png`, `resonance-opening-mobile.png`, `resonance-opening-fallback.png`, `resonance-codex-desktop.png`, `resonance-codex-mobile.png`, `resonance-pathways-mobile.png`, `resonance-combat-shift.png`, `resonance-flow-reference.png`, `resonance-pathways-desktop.png`. Khung kiểm tra cuối clip: `resonance-film-at-6s.jpg`.

## Cách thử và bước kế

Node24: `npm run dev -- --port 5180`. Bắt đầu hành trình mới → clip → gara → chuẩn bị → radio → sổ tay → tab SIÊU PHÀM. Tab HỒ SƠ theo dõi chương và chứng cứ. Save Journey/O1 dùng nút tải riêng.

Cần playtest của người chơi về nhịp truyện, nguồn di vật, sức mạnh giảm risk/skill7 và cảm giác hấp dẫn. Tiếp theo chọn shot mở bệnh viện hoặc Bắc Sơn từ art tương ứng và shot list/lore brief; không tự gen hàng loạt. Gate tự động đã đạt; playtest nhịp truyện/cân bằng và reduced-motion/thiết bị thật còn mở.

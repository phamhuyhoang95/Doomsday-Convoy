# LAST CONVOY — bản bàn giao để Claude review và cải tiến

Ngày tổng hợp: 30/10/2026. Source được đối chiếu tại `72276d0` (implementation gần nhất `c8d1749`). Đây là bản tóm tắt hiện trạng, không phải tuyên bố đã hoàn thành toàn bộ đề xuất Argon. Phiên tổng hợp chỉ đọc source/tài liệu/Git, không chạy lại QA hoặc sửa gameplay.

## Mục tiêu sản phẩm và phản hồi cần giải quyết

Game browser tiếng Việt về đoàn xe sinh tồn giữa tận thế/quỷ dị có quy tắc, kết hợp quản lý tài nguyên, chiến thuật theo lượt và điều tra cốt truyện. Hướng mỹ thuật theo concept Argon trong `docs 2/concepts/`: tối, điện ảnh, giao diện tập trung vào hiện trường và nhân vật.

Người chơi đã đánh giá combat tốt hơn, nhưng UI còn thiếu hấp dẫn; di chuyển từng nhảy cảnh đột ngột; nhiều địa điểm chỉ có vài lựa chọn ngắn, dễ đoán. Đã bổ sung cinematic, auto, lựa chọn liên địa điểm và siêu phàm, nhưng chưa có human playtest chứng minh đã giải quyết hết các vấn đề này.

## Những gì đã triển khai

### 1. Nền gameplay, hành trình và nhiệm vụ

- Đồ thị 8 địa điểm/11 tuyến: gara, chợ, cầu vượt, trạm dịch vụ, sân bệnh viện, khu điều trị, checkpoint và nơi trú Bắc Sơn.
- Năm tài nguyên: lương thực, nước, nhiên liệu, thuốc, phế liệu; HP/năng lượng nhân vật, độ bền xe, chi phí thời gian, nguy cơ đường đi, trinh sát, nghỉ, sửa xe và huấn luyện.
- Đội khởi đầu Minh/Lan/Bảo; có thể cứu Hà. Phe Tro Tàn có mục tiêu/clock/di chuyển thật, có thể tranh quyền sở hữu kỳ vật với người chơi.
- Event/quest/điều kiện/hậu quả, sở hữu kỳ vật, loot, bắt giữ, đàm phán và nhiều kết cục là hệ thống thật. World facts tách khỏi điều người chơi đã biết.
- Nhiệm vụ hiện trường “Chợ mất điện”: 5 điểm tương tác, phân công người ra ngoài/giữ xe, cảnh giới0–6, ba-lô2kiện, điện, cứu Hà, khủng hoảng và debrief. Hai lựa chọn module: giảm20% xăng đi đường hoặc hồi6HP cho thành viên bị thương sau travel.

### 2. Combat tactical mới và auto

- Tối đa4slot mỗi phe, hai hàng; cận chiến chịu ràng buộc vị trí, đổi chỗ tiêu lượt. Có thứ tự lượt, ý đồ địch, năng lượng, cooldown theo lượt nhân vật, status và combo; địch có thể đánh người hoặc xe.
- Mở encounter tiêu1giờ; lượt/hậu chiến tactical không trôi giờ hành trình. Kết quả chốt trước animation; save/load/skip không đổi kết quả.
- Có preview sát thương, hồi sinh/cầm máu, phá giáp, bleed, guard, reflect, kỳ vật và hỗ trợ xe. Bundle hiện tại có18 tactical abilities, trong đó12 thuộc pathway.
- AUTO dùng command thật; ưu tiên cứu thương, sửa xe nguy cấp, đánh/combo; dừng khi thao tác tay, load, ẩn tab hoặc tới hậu chiến. Không tự bắt giữ/đầu hàng/rút lui/giải quyết truyện. Policy vẫn đơn giản, chưa chủ động khai thác toàn bộ buff, đổi chỗ, AoE và bộ skill siêu phàm mới.

### 3. Lore, chương và lựa chọn nối dài

- Bundle hiện tại có22events,4quest contracts; đã thêm arc radio → nước niêm chì → hậu quả ở điểm dừng sau → hồi đáp tại checkpoint. Điều tra mở phương án mới, hậu quả thay đổi tài nguyên/HP/knowledge thật; có fallback.
- Ba chương trên bản đồ hiện hữu: **Đèn còn sáng → Danh sách những người chưa về → Bên kia tín hiệu Bắc Sơn**. Đây là cách tổ chức nội dung/mục tiêu, chưa phải ba map/nhiệm vụ lớn mới.
- Canon “Hồi Chuông Số Không”: Đề án Đối Âm chạm vào Phía Vọng thông qua tên gọi, vật chứng và nhịp lặp. Đồng bộ điểm danh lúc00:07 tạo các điểm neo, khiến nghĩa vụ chưa hoàn tất vận hành như quy tắc cục bộ. Thánh An là bộ khuếch đại, Bắc Sơn là trạm lưu/chuyển tiếp; tắt một máy không tự xóa mọi quỷ dị.
- Sáu hồ sơ có nguồn và mức độ chắc chắn; chỉ hiện sau khi thu được. Tab HỒ SƠ có câu hỏi, checklist chương và nhật ký. Chưa có màn phá lõi/Bắc Sơn mở rộng hoặc kết cục quyết định số phận chân lý.

### 4. Con đường siêu phàm

Mỗi nhân vật có thể chọn một con đường, học ba bậc9→8→7. Nghi thức ngoài combat/nhiệm vụ, không tiêu giờ; dùng XP khả dụng, di vật chung, vật tư và hồ sơ làm gate. XP tích lũy/điểm huấn luyện được bảo toàn; save/replay lưu progression thật. Ba bậc lần lượt dùng10/25/45XP và1/1/2di vật; gate là sổ tay thức tỉnh, hồ sơ Thánh An và hồ sơ Bắc Sơn.

| Con đường | Bậc9 | Bậc8 | Bậc7 |
|---|---|---|---|
| Kẻ Khâu Xác | Chỉ Khâu Đỏ: hồi sinh/cầm máu, buff nếu cầm bleed | Giáp Huyết Nhục: trả HP, giáp chắn/phản đòn | Con Rối Bàn Mổ: dùng xác địch gây AoE |
| Người Nghe Chuông | Thính Giác Âm Giới: giảm thủ | Dư Âm Thánh An: sát thương chuẩn/choáng | Lời Gọi Không Tên: sát thương chuẩn |
| Thợ Rèn Gỉ Sét | Mảnh Đạn Gỉ Sét: phá guard/giáp | Động Cơ Khát Máu: trả HP, sửa xe+húc | Pháo Đài Sắt Sống: bảo vệ xe/yểm trợ hữu hạn |
| Kẻ Đi Trong Gương | Bước Nhảy Phản Chiếu: đổi chỗ/hồi NL/né | Lưỡi Dao Thủy Tinh: khai thác điểm yếu | Thế Giới Ngược Chiều: đảo damage thành heal có trần |

Người Nghe Chuông còn giảm75% rủi ro còn lại sau recon, không stack giữa nhiều người. Cần review cân bằng. Chưa có chuyển/lai ngạch, tha hóa/ethos, hoặc bậc6→0.

### 5. UI, hình ảnh, chuyển động và âm thanh

- Shell/menu/HUD, scene/event, map và combat đã thay bằng hướng Argon; thêm màn SIÊU PHÀM và HỒ SƠ. Crew/inventory/ScenarioScene và một phần component/CSS cũ vẫn tái sử dụng; chưa đạt toàn bộ concept.
- React dựng UI/nhân vật; Pixi lazy-load cho mưa/impact, DOM/CSS có fallback. Sequencer diễn giải battle beats theo thứ tự. Atlas5nhân vật×2pose; chưa có animation nhân vật đầy đủ.
- Art A2 có29master/38mapping, web~8.90MiB; thêm atlas/nền Argon. Đã có master, prompt, receipt, catalog và fallback khi mất ảnh.
- Nhạc combat Gemini đã tích hợp, loop~76giây. SFX/ambience và nhạc khám phá còn dùng Web Audio tổng hợp; có volume tổng/music/SFX/ambience, mute và pause theo tab. Chưa có voice-over.
- Travel có shot5.2giây dựng motion từ bus alpha+nền A2, tiếng máy/skip/fallback. Hiện một shot dùng chung các tuyến; đây không phải video Flow.
- Mở đầu có clip Flow8.042giây/720p/audio, dùng ảnh xe và nền chợ của dự án làm reference; web~2.82MB, có xem lại/skip/ESC/timeout/fallback, giữ watermark. Flow UI báo Omni1.1Flash. Chưa có cinematic riêng từng chương; chất lượng mix và nhịp phim chưa được người chơi duyệt.

## Nền kỹ thuật cần giữ

TypeScript strict, React/Vite, Zod, Vitest, Pixi8; Node24. Engine thuần, mọi gameplay mutation qua `processCommand`, seeded RNG, rejected command không đổi state/tick/RNG/log. Không đưa rules vào React hoặc thêm RNG/clock hệ thống vào core.

Mặc định client: `0.3.0-campaign.1-resonance`, slots `resonance-*`; engine0.1.0/state-savev3. Giữ Journey/O1/R1/archive và slots riêng để save/replay cũ tiếp tục đúng luật. Thay rules cần đánh giá version/compatibility; không xóa legacy để đơn giản hóa review. Hiện single-player localStorage, chưa có server multiplayer hoặc AI runtime.

## Bằng chứng và giới hạn

Lần kiểm chứng gần nhất29/10/2026: `npm run check` đạt146/146tests (9files), validators/strictTS/build pass. Resonance48runs:36thắng/12thua chủ đích,0softlock/rejected,48save-load/replay khớp. Bot không tự thăng bậc; có17tests riêng về lore/progression/operators. Không suy ra cân bằng/hấp dẫn từ test pass.

Browser đã thử desktop/mobile390×844, skill/đổi chỗ, lưu-tải pathway, hồ sơ khóa, auto và video playback/skip/404fallback. Chưa chứng nhận điện thoại thật, reduced-motion cấp OS, FPS/memory hoặc subjective audio mix. Build còn cảnh báo chunk lớn (~649kB main/~902kB Pixi trước gzip) và annotation Zod.

## Đề nghị Claude review

1. Đọc source và chơi thử trước khi kết luận thiếu tính năng. Review song song tính đúng của rules/save/replay và trải nghiệm thực tế; findings cần file/line, tình huống, hậu quả và mức ưu tiên.
2. Ưu tiên UI đúng concept, hierarchy/typography/không gian, onboarding và khả năng hiểu lựa chọn/chi phí/combo trên desktop/mobile.
3. Tìm cách làm địa điểm có diễn biến nhiều giai đoạn, hậu quả liên vùng, vai trò/động cơ nhân vật và lựa chọn khó đoán nhưng có cơ sở; tránh chỉ tăng số nút hoặc thêm lore dump.
4. Review kinh tế XP/di vật/vật tư, sức mạnh pathway/passive/skill7, status duration, auto và các chiến thuật lặp dễ thắng. Cần playtest, không chỉ simulation. Kiểm tra cả việc auto dùng kỹ năng tiêu thụ thi thể, vì có hậu quả vượt ngoài tối ưu sát thương.
5. Đề xuất shot list/cinematic/audio gắn từng vùng bằng art/lore có sẵn, cùng cải thiện animation và hiệu năng. Không gen lại asset đã có nếu chưa xác định thiếu gì.
6. Tách bug xác nhận được, nhận xét thiết kế và đề xuất mới. Đưa roadmap2–3đợt có acceptance criteria; không mặc định phải thay framework/viết lại engine hoặc triển khai mọi mục Argon ngay.

## Tài liệu và source cần xem

- Bắt đầu: `AGENTS.md`, `docs/ai/START_HERE.md`, `HANDOFF.md`, `PROJECT_MAP.md`, `docs/engineering/ARCHITECTURE.md`, `docs/ai/DECISIONS.md`.
- Định hướng: `docs/plans/ARGON_COMBAT_UI_OVERHAUL.md`; đầu vào `docs 2/`, đặc biệt `concepts/` và các spec game/UI.
- Hiện trạng: `docs/reports/ARGON_O1_IMPLEMENTATION.md`, `JOURNEY_FEEL_AND_AUTO.md`, `RESONANCE_IMPLEMENTATION.md`; canon `docs/game/LORE_BIBLE.md`.
- Luật: `src/core/processor.ts`, `src/combat/tactical-*`, `src/occult/`, `src/narrative/`, `src/content/{resonance,pathways,journey,scenarios}.ts`.
- UI: `src/client/argon/`, `App.tsx`, `use-game.ts`, `audio.ts`, `src/read-models/auto-combat.ts`.
- Bằng chứng: `tests/`, `artifacts/resonance-*`; media `art/flow-cinematics/`, `art/argon-o1/`, `art/production-a2/`, `public/`.

Chạy bằng Node24: `npm run dev -- --port 5180`. Khi review cần kiểm chứng: `npm run check`; simulation mới phải chọn `--content resonance` vì CLI mặc định vẫn R1. Không dùng save cá nhân để QA.

**Lưu ý chuyển tài liệu:** `docs 2/` và `last-convoy-r2-redesign-docs.zip` hiện chưa tracked. Nếu Claude chỉ đọc GitHub sẽ thiếu concept/spec Argon đầu vào; cần gửi kèm riêng. Không lấy các HANDOFF/PROGRESS trong `docs 2/` làm trạng thái triển khai hiện tại.

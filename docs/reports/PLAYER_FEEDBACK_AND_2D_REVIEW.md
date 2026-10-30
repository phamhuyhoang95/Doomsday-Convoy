# Review phản hồi chơi thử và đề xuất khám phá 2D

30/10/2026; source đối chiếu `76398fc`. Đầu vào: hai bản nhận xét người dùng gửi từ Gemini/Claude và đề xuất giữ lớp chiến lược, thêm lớp khám phá. Phiên này chỉ đọc source/tài liệu/scripts và đánh giá; không chơi lại, chạy script của bên khác, test/build/simulation, sửa rules hay tạo asset. Số liệu kết thúc các playthrough là báo cáo do người dùng cung cấp, chưa đối chiếu accepted-command log/save của từng lượt.

## Kết luận

Chẩn đoán thiếu áp lực, thiếu agency tại địa điểm và kết thúc hụt là đáng xử lý. Giữ chiến lược và thử một khu khám phá nhỏ là hướng khả thi, nhưng không tự chứng minh sẽ vui hơn. Không đồng ý kết luận 2D tất yếu phá engine, hoặc nhân rộng Scenario hiện tại sẽ tạo trải nghiệm điều khiển giống 2D. Hai hướng giải quyết các nhu cầu khác nhau và có thể kết hợp có giới hạn.

## Đối chiếu nhận xét với source

| Nhận xét | Kết quả đối chiếu / giới hạn |
|---|---|
| Tài nguyên khởi đầu96food/108water/34fuel | Đúng tại `src/content/campaign.ts:167`, được các bundle Argon/Journey/Resonance kế thừa. Nhưng dư46food không đủ “cả tuần”: `supplyCosts` tính theo người sống × giờ, hiện1food/người/giờ. Ba người chỉ còn khoảng15giờ theo food; có thêm người/tù binh còn ít hơn. Cần đánh giá dự trữ so với quãng đường và nguồn nhận, không dựa số tuyệt đối. |
| Quạ36HP/Tàn30HP | Đúng tại `src/content/campaign.ts:55–72`; Argon không tăng chỉ số hai nhân vật này. HP thấp cộng với skill player mới là rủi ro mất cân bằng có căn cứ. Chưa tái hiện số hiệp/damage từng trận trong phiên này. |
| Bắc Sơn kết thúc ngay | Đúng: `src/core/processor.ts:291–316` chốt won khi đến goal; `src/content/world.ts:176` đặt goal là nơi trú. Không có lớp cao trào bên trong Bắc Sơn. |
| Không có hiểm họa đường đi | Chưa chính xác: world có risk và RNG gây damage xe. Phần thiếu là hiểm họa được diễn thành tình huống tương tác có tín hiệu, quyết định và hậu quả, thay vì chỉ số damage sau travel. |
| Cần thêm rút lui trả giá | Đã có: tactical retreat tiêu2fuel và5độ bền xe (`src/combat/tactical-engine.ts:750`). Có thể cải tiến luật/presentation, không gọi là tính năng chưa tồn tại. |
| Hai cách chơi cùng ending nghĩa là không có phân nhánh | Chưa đủ kết luận. `src/content/endings.ts` phân theo ownership/cứu Hà/cách xử lý đối thủ; hai tuyến đánh hoặc bỏ chạy đều giữ gương vẫn có thể rơi vào cùng ending. Điểm yếu có thể là phản hồi/kết cục không thể hiện khác biệt đủ rõ. |
| 00:07/biến cố sửa15phút | Clock hiện có1tick=1giờ, chưa có phút gameplay. Không thể trông chờ world clock tự chạm00:07; cần cue authored hoặc đồng hồ nhiệm vụ cục bộ được đặc tả. |

Các scripts browser do bên review để lại vẫn untracked, không sửa hoặc chạy. Ví dụ `scripts/run2_peaceful.mjs` gán trực tiếp value input React và tìm selector theo text/class; chưa xác minh initialSeed từ save/log nên không dùng nhãn101 làm chứng cứ seed đã chắc chắn đúng. Các lượt cùng lộ trình và có can thiệp thủ công/cancel không thay kiểm chứng nhiều nhánh có artifact.

## Những đề xuất nên điều chỉnh

**Không cắt60% tài nguyên rồi tăng đôi toàn bộ quái ngay.** Với3người,30food chỉ tương đương10giờ trước khi có tiếp tế; thao tác đọc event và điều tra hiện cũng tiêu giờ. Cắt mù có thể phạt người tò mò, làm đường tùy chọn chết sớm, trong khi đường biết sẵn đáp án vẫn dễ. Cần lập bảng thu/chi và kiểm tra các tuyến ít loot/cứu thêm người/né combat/thiếu thuốc, rồi điều chỉnh từng nguồn, đòn và chi phí. Không tăng độ khó chỉ bằng kéo dài số hiệp hoặc bắt buộc chết người.

**Combat cần vấn đề chiến thuật.** Ví dụ địch báo trước sẽ đánh xe sau hai lượt, một kẻ giữ đèn cho kẻ khác, hoặc đòn bị phản nếu chưa phá điều kiện. Có cửa khắc chế/thoát/đàm phán và cái giá dễ hiểu. Giữ AUTO; sửa tình huống để người chơi có lý do can thiệp, không cố tình làm auto ngốc hoặc buộc thao tác tay cho đủ thủ tục.

**Climax cần trả lời hành trình.** Bắc Sơn có thể là kiểm tra quy tắc ở cổng, cứu một người hoặc chấp nhận mất vật chứng để qua, không nhất thiết boss combat bắt buộc. Debrief nên hồi đáp người còn sống, kỳ vật, tuyến đã đi và các lựa chọn. Vì core hiện chốt won khi tới refuge, phải đặt thử thách trước goal hoặc thay contract/version; không dựng dialog UI sau khi engine đã kết thúc rồi gọi đó là màn chơi thật.

**Giới hạn asset/ước lượng:** “AI không thể tạo animation nhất quán”, “thô chắc chắn mất phong cách”, “3–6tháng” hay “cân bằng1–2ngày” đều quá chắc khi chưa có brief, đội ngũ và tiêu chí chất lượng. Asset animation là rủi ro thật, nhưng prototype silhouette vài phòng khác hẳn game vật lý/AI truy đuổi/animation đa hướng đầy đủ. Không hứa thời gian hoặc chất lượng khi chưa thử.

## Scenario không phải template tổng quát hoàn chỉnh

Source hiện là slice riêng cho chợ, không chỉ đổi JSON là ra bệnh viện:

- `src/scenario/engine.ts:6,38,65,92,137,158` import/chọn chợ trực tiếp, gắn cứng location/node/action và hậu quả theoID. State có `powerOn`, `rescuedHa`, một slot scenario. Muốn nhiều nơi cần registry/config, operator và trạng thái từng chuyến; không copy cả engine hoặc switch theoID trong React.
- `engine.ts:145` có requiredRole nhưng kiểm tra đều là mechanic; mở role khác sẽ sai. Cần resolver role chuẩn và test vai trò trước khi nhân rộng.
- `engine.ts:248–305` cho finish khi completed/evacuated, phát cargo reward và giữ cargo mà không có chốt đã nhận thưởng. Đọc tĩnh cho thấy nguy cơ gửi finish lần nữa nhận tiếp/thay module; UI ẩn màn không phải bảo vệ engine. Cần test command lặp và chốt idempotence trước khi giảm tài nguyên hoặc dùng làm mẫu. Chưa tái hiện bằng runtime ở phiên review này.
- `engine.ts:300–303` cộng2giờ/trừ cứng6food+6water bằng clamp, chưa đi qua cùng phép tính khẩu phần theo số người. Siết kinh tế mà không thống nhất giao dịch có thể tạo hành vi lệch, đặc biệt khi có Hà/tù binh.
- Thanh maxAlert6 nhưng crisis đang kích hoạt từ4, hoặc từ2 khi mang hàng về bãi (`engine.ts:106,194`). Mô tả “đầy6mới bị phát hiện” trong đề xuất không phải luật hiện tại.

Đây là hạng mục audit trước mở rộng, không phải kết luận toàn bộ Scenario hỏng hay yêu cầu viết lại game.

## Thêm 2D mà vẫn giữ deterministic/replay

Kiến trúc hai lớp phù hợp: chiến lược chọn nơi/đội/vật tư; local exploration quyết định vị trí/hành động/nguy cơ; kết quả về convoy bằng transaction thật.

- Dùng tọa độ nguyên/lưới ẩn và logic theo bước cố định. Rendering nội suy mượt; FPS không quyết định kết quả. Va chạm, tiếng động, nhìn thấy và di chuyển quỷ dị thuộc core, không chỉ là hiệu ứng client.
- Input trở thành command được kiểm tra, RNG seed, local clock/position/inventory/hazard state đều lưu và replay. Không cho client tự báo phần thưởng hoặc tự giảm HP rồi gửi kết quả cuối.
- Không dùng world tick1giờ cho từng bước chân; đặc tả cách thời gian/nhiên liệu chờ xe tích lũy và quyết toán, tránh thu hai lần. Pause/ẩn tab/save/load không tạo lợi thế reset địch hoặc farm đồ.
- Không đưa pipeline hiện tại chạy60command/giây: `processCommand` clone và validate cả state/log; adapter autosave sau command, save kiểm replay. Cần command granularity/batching, checkpoint và đo tải trước khi chọn realtime dày. Lưới có chuyển động nội suy là lựa chọn thử ít rủi ro hơn physics tự do.
- Pixi8 đã có và được dùng tại `Atmosphere.tsx`; có thể tái dùng để thử stage. Chưa có căn cứ cần cài Phaser hoặc chuyển Godot. Điều này không có nghĩa collision/AI/level editor tự có sẵn.

Nhân rộng hotspot Scenario tăng lựa chọn và hệ quả, nhưng không thay được cảm giác tự đi/né/nấp. Ngược lại, thêm WASD mà không có quyết định đáng giá chỉ đổi bấm nút thành đi bộ giữa các nút.

## Thử nghiệm đề nghị — chưa triển khai/chưa coi là đã duyệt

Một khu nhỏ **Phòng trực Thánh An**,3phòng, mục tiêu trải nghiệm2–3phút; giữ bản đồ/đoàn xe/quản lý và combat đang có.

- Điều khiển một nhân vật bằng phím hoặc chạm; người giữ xe hỗ trợ qua contract đơn giản, chưa có AI đồng đội đi theo.
- Một quy tắc: bóng chỉ tiến khi nghe tiếng động trong vùng tối. Đi/chạy, đèn, vị trí và cửa tạo tín hiệu quan sát được; không giải thích toàn bộ trước khi người chơi thử.
- Hai vật cần mang về, sức chứa hữu hạn; một hồ sơ và một quyết định lấy thêm đồ hay rút. Có đường rút sớm/fail có hậu quả, không khóa cả campaign.
- Một quỷ dị, chuyển động theo quy tắc; không physics động, procgen, platforming, đánh realtime, boss, nhiều tầng hay animation nhân vật đầy đủ.
- Dùng hình thử để kiểm cơ chế và một phòng đại diện hoàn thiện hình/ánh sáng để kiểm phong cách Argon. Không gọi greybox là UI đã đạt concept; không gen asset hàng loạt trước khi xác định nhu cầu.
- Gate: người chơi hiểu được quy tắc qua tín hiệu và thay đổi cách chơi; có tradeoff đáng kể; control dễ dùng trên desktop/mobile; save/load giữa phòng khớp; phần thưởng không nhận lại; thoát/reset không farm/softlock; hiệu năng/log/save không phình theo từng frame. Đánh giá bằng chơi thử, không chỉ test pass.

Trước thử nghiệm: audit kinh tế/Scenario và chọn baseline so sánh. Chỉ prototype một khu; chưa nhân rộng bệnh viện/checkpoint đồng loạt. Sau khi chơi thử, quyết định giữ dạng hotspot, dùng khám phá 2D hoặc phối hợp. Đào sâu cao trào Bắc Sơn là đợt riêng, không tự mở thêm chiến dịch sau Bắc Sơn trong scope này.

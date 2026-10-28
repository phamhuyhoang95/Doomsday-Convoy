# LAST CONVOY — báo cáo cải thiện trải nghiệm R1

Ngày 2026-10-28. Kế hoạch trước triển khai: [PLAYABILITY_PLAN.md](PLAYABILITY_PLAN.md). Content mới `0.1.0-campaign.5-r1`; engine 0.1.0, state/save v3. Không thêm package runtime.

## Thay đổi có thể chơi

| Phản hồi | Hành vi đã triển khai |
|---|---|
| Không có âm thanh | Web Audio tạo drone/gió, attack/skill/hurt/reward/travel/victory cues; bật từ tương tác người dùng, mute/volume lưu qua phiên |
| Khó thấy chiến đấu | Lựa chọn Đột kích kho đứng đầu event chợ, mở combat thật với hai đối thủ 46/40 HP; main rival vẫn là trận riêng ở màn 3 |
| Trinh sát không có tác dụng | Cache một lần, manh mối/XP và intel giảm 50% rủi ro tuyến trong 5 giờ; hết hạn chỉ refresh intel, không farm vật tư/XP |
| Chờ không có tác dụng | Nghỉ hồi tối đa 5 HP và 2 energy/người/giờ; vẫn tiêu khẩu phần và cho NPC thời gian. Đầy sức có cảnh báo chỉ đang chờ |
| Khó thấy hậu quả/phần thưởng | Preview tổng chi + outcome/chance; báo cáo net/gross costs/loot, HP/energy/xe, XP, quest và ownership sau command; nhật ký ghi các thao tác mới |
| Đoàn xe bị giấu ở tab | Resource/xe/khẩu phần, HP/energy/công/thủ/điểm nâng của crew hiện trên map |
| Không tùy chỉnh nhân vật | Điểm đầu hành trình và XP từ khám phá/combat; nâng công/HP/energy thật, chọn Cân bằng/Xung kích/Yểm hộ; cấu hình không trôi tick |
| Skill thiếu ý nghĩa | Chọn mục tiêu/skill, xem damage range/heal/cost/cooldown rồi thi triển; Cấp cứu dùng được ngoài trận; Linh cảm khám phá quy tắc và scout sâu giảm 70% risk |

Đột kích kho thắng nhận 22 food, 20 water, 4 fuel, 2 medicine, 5 scrap, 10 XP/người. Mỗi hành động combat vẫn tiêu khẩu phần nên thay đổi ròng khác loot gộp; UI giải thích cả hai. Enemy AI gây tổn thương người/xe; downed/capture/finish vẫn có hậu quả. Encounter phụ không giải nhầm story của Tro Tàn.

## Mã nguồn chính

- `src/expedition/`: schema, operations, progression, read model.
- `src/content/operations.ts`, `encounters.ts`, `campaign.ts`: dữ liệu balance và encounter phụ; vẫn 12 event.
- `src/read-models/`: preview skill/effects và báo cáo transition thuần TypeScript.
- `src/client/components/CrewConsole.tsx`, `ActionDeck.tsx`, `ActionReport.tsx`, `CombatPanel.tsx`, `EventPanel.tsx`: UI nối vào command processor.
- `src/client/audio.ts`, `AudioControl.tsx`, `styles/playability.css`: âm thanh và feedback hình ảnh.
- `src/content/archive/campaign-v4.json`, `registry.ts`, `src/persistence/compatible.ts`: bundle legacy và slot tách biệt.
- `tests/playability.test.ts`, `tests/fixtures/v01-saves.json`: kiểm thử mới và save thật tạo từ code Git `8f987d7`.

## Gate tự động đã chạy

```sh
npm exec --yes --package=node@24 -- npm run check
npm exec --yes --package=node@24 -- npm run simulate:campaign -- --seeds 300 --output artifacts/r1-simulation.json
git diff --check
```

`check`: **103 tests / 5 files pass**, world/content validation, TypeScript strict và production build thành công. 17 tests mới phủ cache/intel/no farming, rest/repair, training/stances, heal ngoài trận, early combat/XP, invalid remote targets, read models, refs và legacy save/replay/slots. Bộ tests cũ tiếp tục pass.

Simulation cuối ghi ở [artifacts/r1-simulation.json](artifacts/r1-simulation.json): **300 seed × 8 policies = 2.400 runs**, **1.800 thắng / 600 thua hợp lệ / 0 softlock / 0 rejected command**. Sáu policy hoàn thành đều thắng 300/300; starvation và guaranteed lethal hazard đều thua hợp lệ 300/300. **2.400/2.400 save/load và replay khớp**, issue list rỗng, tối đa 32 commands/run. Không cộng batch 100 seed trước đó vào số mẫu cuối vì trùng seed.

## Browser QA thực tế

Production `http://127.0.0.1:4173/`, seed 42:

- Tải save v0.1 bằng bundle legacy, banner đúng; bắt đầu R1 giữ riêng slot cũ.
- Scout ở gara nhận fuel/scrap/3 XP, tiêu 3 food + 3 water; risk tuyến 15% → 7.5%, nút khóa khi intel còn hạn.
- Nâng công Minh +2 và đổi Xung kích +3 công/−2 thủ ngay trên map; tick giữ nguyên. Damage range phản ánh công 19.
- Cứu Hà, chọn Đột kích kho; Minh đổi mục tiêu sang Kẻ Rình, Phá giáp 33 HP, energy −2; Lan kết liễu. Enemy đánh Hà −9 HP, xe −2 condition. Thắng nhận loot/10 XP/điểm nâng; bắt hai NPC, kết thúc trận.
- Nghỉ hồi Hà 55 → 60 HP, Minh +1 và Bảo +2 energy; sửa xe 98 → 100, −2 scrap. Cấp cứu Hà 60 → 64, tiêu medicine/energy và khẩu phần; không cho heal người đầy HP.
- Save thủ công → nghỉ → load: HUD/crew/tick quay đúng snapshot. Các fixture legacy mid/completed/waited replay bằng rules cũ khớp nguyên snapshot.
- Dùng Linh cảm tại bệnh viện: phát hiện quy tắc, +2 medicine từ cache, risk tuyến ward 10% → 3%. Đọc hồ sơ, cứu người bệnh, đi theo dấu gương vì Tro Tàn đã lấy trước.
- Trận chính: Phá giáp/attack hạ Quạ/Tàn; loot/Mắt gương đổi chủ thật. Bắt giữ, chăm sóc tù binh rồi tới Bắc Sơn, kết cục **Bình minh có thêm một người**, T40, 4 người sống, 1 kỳ vật, xe 100%, còn 3 food.
- AudioContext báo running sau click; mute/unmute đổi trạng thái, volume đổi 0 → 100 → 40. Không có console warning/error được ghi trong tab production. Chưa có đánh giá chất lượng âm thanh bằng người nghe.
- Harness 390 × 844 tại dev: start/scout/result/disabled state, mở tùy chỉnh, train/stance, tới chợ, chọn target và thi triển Phá giáp (Kẻ Rình 40 → 7 HP). Không thấy control tràn ngang; report có nút đóng, nội dung dài cuộn được.
- Harness ghi 4 lỗi MutationObserver không kèm source URL; không tái hiện khi mở/chơi game dev hoặc production trực tiếp, và source game không sử dụng observer. Chưa xác định chắc nguồn log này; không ghi mobile console là sạch.

Ảnh: [dashboard](artifacts/r1-gameplay.png), [tùy chỉnh](artifacts/r1-customization.png), [combat](artifacts/r1-combat.png), [ending](artifacts/r1-ending.png), [mobile](artifacts/r1-mobile.png), [mobile skill](artifacts/r1-mobile-combat.png).

## Cách thử

`npm run dev` hoặc `npm run build && npm run preview`. Trên menu R1 chọn **Bắt đầu hành trình**, thử scout và nhấp Minh để nâng công/thế đánh. Tới **Chợ sơ tán**, giải quyết Hà rồi chọn **Đột kích kho**. Skill được chọn để xem preview, sau đó bấm **Thi triển**. Bật nút nhạc, điều chỉnh volume trên desktop.

Save v0.1 được giữ để tiếp tục theo rules cũ; các cơ chế mới cần chuyến R1 mới. Save cùng origin/port/browser; không tự đồng bộ giữa 5173 và 4173.

## Giới hạn và bước tiếp

- Chân dung, cảnh và hiệu ứng vẫn là CSS/SVG/typographic placeholders. Audio là synth procedural; chưa có soundtrack/voice/foley thu âm, animation nhân vật hoặc tactical grid.
- Đây là một lượt cải thiện theo phản hồi; cần người chơi thử lại để đánh giá nhịp chơi, độ căng và mức thích thú. Chưa xác nhận mục tiêu thời lượng 30–60 phút bằng human playtest.
- Simulation kiểm tra những policies đã khai báo. Các chuỗi người chơi tùy ý có thể dẫn tới thất bại hợp lệ; số test không chứng minh mọi trạng thái đều có đường thắng.
- Build còn warning annotation `@__PURE__` của Zod và chunk JS ~534 KB (gzip ~157 KB), do kèm rules/content legacy. Không có lỗi build; chưa tối ưu tải bundle bằng code splitting.
- Bước tiếp theo theo review người dùng: cân bằng combat/resources và nhịp gặp địch; nếu muốn tăng chất lượng hình/âm thanh, cần một scope asset và animation riêng.

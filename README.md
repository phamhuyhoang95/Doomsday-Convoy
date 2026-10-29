# LAST CONVOY — MVP v0.1

Game chiến thuật đoàn xe sinh tồn với core TypeScript headless và client React/Vite. Đã triển khai Phase 0–5: một chiến dịch ba màn có di chuyển, event, điều tra, kỹ năng, kỳ vật, NPC đối thủ, chiến đấu theo lượt, bắt giữ, nhiều kết cục và save/load.

## AI mới tiếp nhận dự án

Đọc [AGENTS.md](AGENTS.md) → [START_HERE](docs/ai/START_HERE.md) → [HANDOFF](docs/ai/HANDOFF.md) → [PROGRESS](docs/status/PROGRESS.md). Toàn bộ tài liệu chính thức có trong [docs/README.md](docs/README.md).

**Hiện tại:** New game dùng Journey trên combat Argon: chuyển cảnh xe, auto combat, lựa chọn liên địa điểm. Đã kiểm chứng 129 tests và 48 Journey runs; còn các đợt UI/content tiếp theo. Đọc [HANDOFF](docs/ai/HANDOFF.md) trước khi làm tiếp.

**R1 — cải thiện trải nghiệm:** thêm trận kho hàng ở chợ, trinh sát có cache/intel, nghỉ hồi sức, sửa xe, XP/huấn luyện/thế đánh, skill preview, bảng hậu quả và âm thanh Web Audio. [Kế hoạch](docs/plans/PLAYABILITY_PLAN.md), [báo cáo thực tế](docs/reports/PLAYABILITY_REPORT.md).

## Chơi trên trình duyệt

Dùng Node.js 24 (xem `.nvmrc`), hoặc Node 22.12+.

```sh
npm ci
npm run dev
```

Mở http://127.0.0.1:5173, chọn seed rồi bắt đầu. Trên máy đang dùng Node 23, có thể chạy runtime tạm thời mà không thay Node toàn hệ thống:

```sh
npm exec --yes --package=node@24 -- npm run dev
```

Chọn **Bắt đầu hành trình** để chơi Journey. Nút **Tải Argon O1** giữ luật/nội dung cho autosave O1; R1/v0.1 có nút tải riêng. Xem [báo cáo Journey](docs/reports/JOURNEY_FEEL_AND_AUTO.md). Các thao tác nền R1 tiếp tục được giữ: HP/năng lượng/công/thủ và điểm nâng hiện ngay trên map; nhấp nhân vật để huấn luyện, đổi thế đánh hoặc dùng Cấp cứu/Linh cảm. Trinh sát nhận cache một lần và giảm rủi ro tuyến trong 5 giờ. Nghỉ hồi sức nhưng tiêu khẩu phần và cho NPC thời gian; sửa xe tiêu phế liệu. Mỗi hành động có bảng kết quả và chi phí/phần thưởng thực tế.

Tới **Chợ sơ tán**, giải quyết chuyện Hà rồi chọn **Đột kích kho** để mở trận đầu. Trong combat, chọn đối thủ, chọn skill để xem sát thương/chi phí rồi **Thi triển**; có thể chọn đồng đội bị thương để Cấp cứu. Thắng nhận loot và XP thật. Đối thủ downed có thể bị bắt; người downed bị bỏ lại khi kết thúc trận sẽ chết. Nhiệm vụ & manh mối ghi thông tin đã khám phá; Kho đồ ghi quyền sở hữu kỳ vật.

Autosave ghi sau mỗi command hợp lệ. Lưu game/Tải game dùng slot thủ công riêng trong localStorage của browser/origin này. Đổi trình duyệt hoặc port sẽ không chia sẻ save. R1 dùng slot `r1-autosave/r1-manual`, giữ nguyên slot v0.1 cũ. Nút **Tải hành trình v0.1 cũ** tải bằng bundle rules/content lịch sử `.4`; các cơ chế R1 cần chuyến mới. Save không thuộc bundle được hỗ trợ sẽ báo không tương thích; save logistics Phase 1 có migration.

## Kiểm tra và chạy headless

```sh
npm run check
npm run demo -- --seed 42 --path direct --save artifacts/demo.save.json
npm run demo:campaign -- --seed 42 --policy peaceful
npm run demo:campaign -- --seed 42 --policy combat
npm run simulate -- --seeds 1000 --output artifacts/phase1-simulation.json
npm run simulate:campaign -- --seeds 300 --output artifacts/phase5-simulation.json
npm run build
npm run preview
```

`check` chạy world/content/art validators, Vitest, TypeScript strict và production build. Policies campaign: peaceful/combat/trade/surrender/fallback/ruthless. Batch thêm starvation và guaranteed lethal hazard để kiểm thử thất bại hợp lệ. CLI trả exit khác 0 nếu có softlock/rejected command. Simulation lớn có thể mất vài phút vì xác minh replay/save của từng lượt.

`preview` phục vụ build production tại http://127.0.0.1:4173. Save ở port 5173 và 4173 tách biệt theo origin của trình duyệt.

## Nội dung và kiến trúc

- Bundle Journey: 8 địa điểm, 11 tuyến, 16 event; R1/O1 giữ 12 event, 4 Story Contract, 6 kết cục đến nơi trú cùng các trạng thái thất bại.
- 3 nhân vật ban đầu; có thể cứu Hà lên xe. 1 đoàn đối thủ có mục tiêu riêng và có thể lấy gương trước bạn; thêm encounter phụ hai kẻ giữ kho chợ.
- 4 skill data driven, 2 artifact instances có owner duy nhất, 1 anomaly có quy tắc, 5 tài nguyên.
- `src/core/`: state/commands/RNG/invariants/events/replay, độc lập React/storage/network.
- `src/world/`, `src/narrative/`, `src/combat/`: bản đồ/NPC, conditions/effects/director/contracts, combat/skills/loot.
- `src/expedition/`, `src/read-models/`: trinh sát/nghỉ/sửa xe/XP/tùy chỉnh và preview/báo cáo thuần TypeScript.
- `src/content/`, `src/assets/`: content registry bằng Zod, asset IDs và fallbacks.
- `src/client/`: render state, read models và dispatch commands; không tự resolve kết quả gameplay.
- `src/persistence/`, `src/simulation/`, `scripts/`, `tests/`: save migration, bots, CLI và verification.

Không cần hình hoặc âm thanh để chạy engine. Client đã có art A2 và fallback CSS/SVG khi ảnh thiếu/lỗi; tình trạng QA trong HANDOFF. [Asset pipeline](docs/assets/ASSET_PIPELINE.md), [gallery](http://127.0.0.1:4173/art/a2/gallery.html). Web Audio tạo drone/gió và cues hành động/combat/phần thưởng sau click đầu; có mute/volume được lưu. Chưa có bản nhạc/voice thu âm. Debug tab hiện trong dev; production có thể bật bằng `?debug=1`. Dev mobile harness: http://127.0.0.1:5173/qa/mobile.html.

## Tài liệu và bằng chứng

- [docs/README.md](docs/README.md): mục lục tài liệu chính thức.
- [HANDOFF](docs/ai/HANDOFF.md), [PROGRESS](docs/status/PROGRESS.md): yêu cầu mới nhất, checkpoints và bước tiếp.
- [PHASE_PLANS](docs/plans/PHASE_PLANS.md), [A2 plan](docs/plans/ASSET_PRODUCTION_PLAN.md): kế hoạch trước triển khai.
- [QA_REPORT](docs/reports/QA_REPORT.md), [PLAYABILITY_REPORT](docs/reports/PLAYABILITY_REPORT.md): bằng chứng theo checkpoint.
- [ARCHITECTURE](docs/engineering/ARCHITECTURE.md), [CONTENT_GUIDE](docs/engineering/CONTENT_GUIDE.md), [GAME_BIBLE](docs/game/GAME_BIBLE.md), [MVP_SCOPE](docs/game/MVP_SCOPE.md).

MVP không có online multiplayer, persistent server, marketplace hoặc AI runtime. Mục tiêu chiến dịch 30–60 phút cần human playtest và cân bằng thêm; chưa xác nhận thời lượng này bằng bot. Các báo cáo seed chứng minh những tuyến đã kiểm thử, không bảo đảm mọi chuỗi hành động có thể hoàn thành.

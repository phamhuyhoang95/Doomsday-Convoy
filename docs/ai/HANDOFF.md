# Bàn giao hiện tại

**Ngày:** 2026-10-29, Asia/Saigon. **Trạng thái hiện tại:** đã cập nhật phân công effort: Astra medium điều phối/chia task; Astra high chỉ review kiến trúc hoặc quyết định quan trọng. Sol/Terra vẫn high. Đợt này chỉ chỉnh docs, không chạy game QA hoặc tạo media.

## Yêu cầu mới nhất

Người dùng yêu cầu giảm mức điều phối của Astra xuống medium và chỉ chuyển high cho review kiến trúc quan trọng hoặc quyết định quan trọng. [AGENTS](../../AGENTS.md#phân-công-model-bắt-buộc) và [WORKFLOW](WORKFLOW.md) là quy tắc hiện hành.

- Điều phối, chia task, plan thông thường, báo tiến độ và review cục bộ: `gpt-6-astra` + `medium`.
- Review/ra quyết định có ảnh hưởng lớn tới kiến trúc, save/replay, thay vòng chơi cốt lõi hoặc scope/ngân sách lớn: Astra `high`, ghi rõ lý do và trở lại medium sau khi chốt.
- `gpt-6.1-sol` và `gpt-6.1-terra`: tiếp tục `high`. Markdown không tự đổi cấu hình của phiên đang chạy; chọn effort qua runtime thực tế.
- R4 và sản xuất media vẫn chưa triển khai. Lần kiểm tra Chrome trước đã thấy Gemini có Tạo nhạc/Không lời và Flow có giao diện PRO tier; chưa tạo nội dung. Kiểm tra lại trạng thái live trước thao tác sản xuất, không dựa vào số dư cũ.

## Bối cảnh đề xuất R4

Người dùng vẫn thấy game tẻ nhạt, màn quá ngắn và không cảm nhận nhạc/chuyển động; yêu cầu đề xuất cải tiến hoặc làm lại để thú vị và dài hơn, đồng thời khảo sát voice/clip bằng Google AI Pro và khoảng $100 Google Cloud.

- Đề xuất chính: [R4_GAMEPLAY_REDESIGN](../plans/R4_GAMEPLAY_REDESIGN.md). Làm lại vòng chơi/cấu trúc màn trên engine hiện có; trước tiên slice “Chợ mất điện” 20–30 phút, sau đó mới hướng tới chiến dịch 65–90 phút. Các phút này là mục tiêu chưa đo, không phải kết quả đã đạt.
- Nghiên cứu dịch vụ/ngân sách: [GOOGLE_MEDIA_PRODUCTION](../assets/GOOGLE_MEDIA_PRODUCTION.md). Ưu tiên Flow có sẵn để làm clip, Cloud TTS cho giọng Việt, cân nhắc Lyria cho nhạc. Chưa xác minh grant $100 của tài khoản; không mặc định nó trả Gemini Developer API.
- Hai sub-agent Terra 6.1 High điều tra source và nguồn Google; Astral tổng hợp/review. Chưa giao Sol code vì user đang hỏi đề xuất.
- Source có BGM tổng hợp/CSS animation; chưa nghe/xem lại runtime nên chưa biết nguyên nhân người dùng không cảm nhận được. Các event/quest một bước và đường bỏ bệnh viện là dữ kiện source; nhận định về sức hút cần human playtest.
- Bảng giá Veo Developer API có cache cũ: preview đã ngừng 22/10/2026 theo trang chính thức. Tài liệu mới đã loại bỏ ước tính dựa trên endpoint này; Flow còn bảng credit riêng.
- Bước tiếp: khi người dùng chọn triển khai hướng R4, làm R4.0 để chốt slice/baseline/compatibility, rồi Sol triển khai từng bước, Terra kiểm chứng và Astral review. Không tự bỏ engine, sản xuất hàng loạt hoặc chi tiền theo một bản đề xuất.

## Bối cảnh phân công model

Phân công trước đây dùng Astra high cho toàn bộ điều phối. Yêu cầu mới nhất thay thế bằng Astra medium mặc định, high chỉ khi review/ra quyết định quan trọng; Sol/Terra giữ high.

- Phân công chính thức và model IDs nằm trong [AGENTS.md](../../AGENTS.md#phân-công-model-bắt-buộc); luồng giao việc và mẫu bàn giao nằm trong [WORKFLOW](WORKFLOW.md).
- "Astral" được ánh xạ tới `gpt-6-astra`; Sol dùng `gpt-6.1-sol`; Terra dùng `gpt-6.1-terra`. Chọn effort theo vai trò hiện hành trong AGENTS, không lấy các ghi chú high lịch sử làm mặc định.
- Astral giữ plan/ưu tiên/review và HANDOFF/PROGRESS; mỗi file có một người ghi; code chuyển Sol, điều tra/kiểm chứng chuyển Terra. Sửa docs nhỏ có thể làm trực tiếp.
- Yêu cầu này không mở lại gameplay QA. Không diễn giải số test lịch sử bên dưới thành kết quả của đợt chỉnh docs.
- Bước tiếp: nhận mục tiêu tiếp theo, đối chiếu hiện trạng rồi phân công theo quy trình mới. Các ghi chú A2 ở cuối là bàn giao cũ; đối chiếu R2/R3 và source trước khi dùng chúng làm checklist hiện tại.

## Bối cảnh R3 từ bàn giao trước

Yêu cầu được ghi trong bàn giao trước: "ok quẩy đi" — Triển khai giải quyết 4 vấn đề: kẻ địch không thể phản công, cuộc chiến một màu, giao diện dàn trải phải cuộn/navigate nhiều và thiếu background music.

Bàn giao R3 trước đó ghi hoàn tất lượt đấu so le, Enemy Intents, banner phản công, BGM Synthesizer và giao diện Scene-Centric, với 103 tests và 800 campaign simulations. Đây là kết quả đã được ghi trước đợt docs này, không phải lần chạy mới.

## Những gì đã làm và kiểm chứng trong đợt R3 theo báo cáo trước

1. **Lượt đấu so le & Kẻ địch Phản công**:
   - Chỉnh sửa `startCombat` trong `src/combat/engine.ts`: Thay vì đưa toàn bộ phe ta lên trước, lượt đấu được xếp so le `[Minh, Kẻ Đói, Lan, Kẻ Rình, Bảo]`.
   - Bảo toàn 100% bản lưu cũ: Nếu `state.contentVersion === "0.1.0-campaign.4"`, giữ nguyên turn order cũ để không phá vỡ fixture replay.
   - Kẻ địch được tăng HP (Kẻ Đói 58 HP, Kẻ Rình 52 HP, giáp 2), trận đánh kéo dài 3–5 lượt căng thẳng.
2. **Hệ thống Ý đồ của Kẻ địch (Enemy Intents)**:
   - Trên mỗi thẻ bài kẻ địch hiển thị huy hiệu `🎯 Ý ĐỒ: Đánh [Tên mục tiêu] (~X HP)`.
   - Người chơi đọc trước hành động sắp tới của quái để chọn thế thủ, hồi máu hoặc kết liễu.
3. **Banner Phản công (Enemy Retaliation Banner)**:
   - `combat.lastEnemyAction` ghi nhận và hiển thị ngay trên đầu đấu trường kèm hiệu ứng rung màn hình và chớp đỏ: `⚡ ĐỐI THỦ PHẢN CÔNG: Kẻ Đói phản công! Lao vào Lan gây 11 sát thương!`.
4. **Giao diện Scene-Centric (Không còn cuộn trang)**:
   - Trong chiến đấu: Toàn bộ màn hình chỉ hiển thị Đấu trường sinh tử. Loại bỏ bảng đoàn xe trùng lặp và các khung nhật ký/hướng dẫn rườm rà.
   - Trên bản đồ: Bản đồ và Sự kiện nằm ngay tầm mắt, dẹp bỏ khung hướng dẫn tĩnh dài dòng.
5. **Hệ thống Nhạc nền Background Music (BGM Polyphonic Synthesizer)**:
   - Trong `src/client/audio.ts`: Bộ tổng hợp âm nhạc procedural Web Audio tự động phát nhạc theo bối cảnh:
     - Nhạc Khám phá: Hợp âm C minor / Eb rải chậm, u uất cùng tiếng chuông vọng.
     - Nhạc Chiến đấu: Nhịp trống tim (Pulse Kick) dồn dập 115 BPM cùng âm bass gầm gừ đẩy áp lực.
6. **Bằng chứng kiểm chứng**:
   - `npm run check`: 103/103 tests pass, validators pass, TypeScript strict pass, build pass.
   - `npm run simulate:campaign -- --seeds 100`: 800/800 runs pass, 0 softlocks, 0 rejected commands.
   - Ảnh chụp thực tế: `artifacts/r3_*.png` và carousel trong `overhaul_combat_and_ui.md` (tài liệu được báo cáo trước đó nhưng chưa tìm thấy trong repo khi rà docs ngày 2026-10-29).

## Bối cảnh R2 đã hoàn tất và kiểm chứng

- **Phase 1: Narrative & Voice**: Đại tu toàn bộ văn phong trong `src/content/texts.ts`, `skills.ts`, `world.ts`, `campaign.ts`, `operations.ts`. Loại bỏ hoàn toàn lối hành văn hướng dẫn thô kệch; văn phong grimdark sắc lạnh, nhân vật có giọng điệu riêng (Minh, Lan, Bảo, Hà, Quạ).
- **Phase 2: Visual Juice & Audio**:
  - CSS Screen shake (`.combat-screen-shake`), chớp đỏ khi trúng đòn (`.hit-loss`), chớp xanh khi hồi máu (`.hit-gain`).
  - Thanh máu trễ (Ghost drain meter) tạo cảm giác sát thương có sức nặng.
  - Phân tầng nguy cơ trận đánh: Tier 1 (Thăm dò), Tier 2 (Nguy hiểm), Tier 3 (Tử chiến) kèm hiệu ứng viền tối nhịp tim (`.pulse-vignette`).
  - Xe di chuyển mượt mà trên bản đồ với đèn pha quét ban đêm bằng SVG interpolation.
  - Bộ âm thanh hiệu ứng Web Audio API tự tổng hợp (`heavy_hit`, `heartbeat`, `eerie_bell`).
- **Phase 3 & 4: Combat Status, Anomaly & Balance**:
  - Hệ thống trạng thái Combat: `vulnerableActorIds` (+40% sát thương phải nhận), `panickedActorIds` (-30% lực tấn công), `bleedingActorIds` (-4 HP mỗi lượt đến).
  - Phối hợp kỹ năng: Kỹ năng công kích kích hoạt Lộ điểm yếu; kỹ năng Trị thương hóa giải Hoảng loạn và Cầm máu.
  - Quỷ dị suy luận (Deductive Anomaly): Gỡ bỏ việc ẩn lựa chọn an toàn qua `known("hospital.rule")`. Người chơi phải tự đọc gợi ý trong nhật ký để chọn đúng quy tắc.
  - Telemetry Tro Tàn trực tiếp trên Map: Hiển thị vị trí và đếm ngược giờ hành động tiếp theo của đối thủ.
  - Tái cân bằng kinh tế: Hạ thưởng đột kích chợ từ 22/20/4/2/5 xuống 9/8/2/1/3; đảm bảo các lựa chọn sinh tồn mang tính đánh đổi thực thụ.
- **Bằng chứng kiểm chứng**:
  - `npm run check`: 103/103 tests pass, validators pass, TypeScript strict pass, build pass.
  - `npm run simulate:campaign -- --seeds 100`: 800/800 campaign runs qua 8 policies, 0 softlocks, 0 rejected commands, 800 save/load checks pass, 800 replay checks pass.
  - Artifact Walkthrough: `artifacts/r2_*.png` và carousel `walkthrough_r2_record.md` (tài liệu được báo cáo trước đó nhưng chưa tìm thấy trong repo khi rà docs ngày 2026-10-29) đã được ghi hình từ mobile viewport.

- MVP Phase 0–5: game ba màn, engine deterministic, quest/combat/NPC/artifacts/save/replay thật.
- R1: scout/rest/repair/XP/stances, early combat ở chợ, cost/result feedback, crew trên map, skill preview, Web Audio, legacy saves.
- A1: bốn ảnh mẫu theo style người dùng thích; đã push `baac6ba`.
- Repository: `git@github.com:phamhuyhoang95/Doomsday-Convoy.git`, branch main. Được phép commit/push thường để bảo toàn công việc; không force push.

## A2 đã thực sự làm

- Có 25 ảnh mới + 4 A1 = 29 master được chọn. Bảy location mới, bảy portrait mới, bốn skill, hai artifact, một anomaly, xe tải alpha và ba event scenes.
- Ba ảnh có nét giả chữ ký/góc đã cleanup bằng image_gen, chọn revision2: Overpass, Service, Hospital Records. Các bản đầu giữ như draft/provenance, không vào catalog.
- Master/jobs/prompts/receipts/build manifest nằm trong `art/production-a2/`. A1 master ở `art/asset-pack-a1/`.
- `scripts/art-pipeline.ts`: sips resize/encode → 29 web images khoảng 8.90 MiB; catalog 38 mappings, refs/kinds/coverage/dimensions/SHA-256/alpha validation.
- Client presentation registry và AssetArt đã nối hình vào menu/map/events/crew/combat/skill/inventory. Map marker/route vẫn tương tác; xe là SVG image overlay. Rules/content version/save không đổi.
- Thumbnail portrait dùng crop bằng CSS frame để mặt đọc được. Bảng kết quả đã đổi sang in-flow phía trên nội dung map/combat, không phủ lên nút lựa chọn.
- Gallery HTTP hoạt động, lọc đúng 8 portrait. Gallery đã nhúng JSON và dùng ảnh tương đối để hỗ trợ mở standalone; chưa xác nhận file:// bằng automation do browser policy chặn giao thức đó. Không thử cách bypass.

## Bằng chứng đã có trước khi dừng

- `npm run art:build` qua Node 24: 29 master / 38 mappings / 29 web images hợp lệ.
- Full `npm run check` gần nhất: 103 tests / 5 files pass, validators và TypeScript/Vite build pass. Build còn warning Zod annotation và chunk JS~543 KB/gzip~161 KB.
- Pillow decode master/web thành công; cả hai xe có alpha thật. Bản web bus 154.209 pixel alpha0, truck 165.128 pixel alpha0; bốn góc đều 0.
- Browser production 4173 đã tải save R1 có sẵn và hiển thị menu/map/portrait mới. Không dùng production để tiến hành trình QA.
- Gameplay QA trên dev 5173: tới chợ, cứu Hà, mở combat, Minh Phá giáp Kẻ Rình 33 HP (40→7), đổi lượt Lan; ảnh/icon hiện và console trực tiếp không có error/warn ở lần đọc đó.
- Đọc DOM xác nhận action report position relative, nằm trước combat panel, không overlay.
- Mobile harness390 × 844 đã thấy crew 4 người, portrait mới và combat scene; chưa hoàn tất vòng QA mobile/map/fallback.
- Ảnh bằng chứng: `artifacts/a2-menu.png`, `a2-map.png`, `a2-gallery.png`, `a2-combat.png`.

## Ghi chú chưa chốt ở checkpoint A2 cũ

1. CSS `.crew-energy` mới nhất có wrap; mobile có thể xuống dòng tách nhãn/chỉ số. Cải thiện non-breaking label/value và dark scrollbar đã được nghĩ tới nhưng **chưa viết**. Không mô tả như đã fix.
2. Missing-image fallback A2 chưa thử chủ động; mobile map pan và mobile combat cast chưa hoàn tất. Legacy browser load trong A2 cũng chưa xác nhận riêng (tests legacy đã pass).
3. Source có CSS thay đổi sau lần full gate gần nhất; chưa có gate xác nhận lại toàn bộ snapshot mới nhất. Không báo A2 QA hoàn tất.
4. Docs A2 report/README delivery cuối chưa có. Chưa commit/push A2 tại thời điểm người dùng yêu cầu dừng test; xem Git log/status để biết WIP checkpoint mới nếu có.
5. Không tạo thêm ảnh để giải quyết các việc trên. Chưa cần gameplay mới, animation, sprite nhiều hướng hoặc audio thu âm.

## Checklist tiếp tục A2 được ghi ở checkpoint cũ

Đọc plan A2 và source diff hiện tại → chốt lỗi trình bày cần thiết → kiểm tra fallback/mobile/legacy bằng UI riêng → chạy gate phù hợp → ghi report/PROGRESS/HANDOFF → commit/push và đối chiếu SHA. Giữ state/save/content `.5-r1` ổn định. Không suy ra “đã push” từ việc file nằm trong workspace.

## Không phụ thuộc phiên cũ

Các handle browser, exec session IDs và functions.store trong cuộc chat có thể hết hiệu lực. Mọi input cần tiếp tục đã có trên filesystem. Browser QA phải dùng API computer-use đã được cung cấp, không tự nối CDP hoặc đọc hidden app state. Dùng file docs này làm điểm bàn giao, không cần transcript cũ.

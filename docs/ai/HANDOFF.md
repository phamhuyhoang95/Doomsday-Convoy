# Bàn giao hiện tại

**Ngày:** 2026-10-28, Asia/Saigon. **Trạng thái:** Bắt đầu triển khai đợt nâng cấp lớn R2 theo yêu cầu trực tiếp của người dùng.

## Yêu cầu mới nhất

Người dùng: "bắt đầu đi" — Triển khai đợt nâng cấp toàn diện R2 theo kế hoạch [R2_UPGRADE_PLAN](../plans/R2_UPGRADE_PLAN.md).
Trọng tâm: Nâng cấp trải nghiệm chơi, sửa từ ngữ bớt word-by-word, bổ sung Game Feel / Visual Juice, phân tầng áp lực Combat và nâng cấp âm thanh.

## Bối cảnh đã hoàn tất trước A2

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

## Phần chưa chốt

1. CSS `.crew-energy` mới nhất có wrap; mobile có thể xuống dòng tách nhãn/chỉ số. Cải thiện non-breaking label/value và dark scrollbar đã được nghĩ tới nhưng **chưa viết**. Không mô tả như đã fix.
2. Missing-image fallback A2 chưa thử chủ động; mobile map pan và mobile combat cast chưa hoàn tất. Legacy browser load trong A2 cũng chưa xác nhận riêng (tests legacy đã pass).
3. Source có CSS thay đổi sau lần full gate gần nhất; chưa có gate xác nhận lại toàn bộ snapshot mới nhất. Không báo A2 QA hoàn tất.
4. Docs A2 report/README delivery cuối chưa có. Chưa commit/push A2 tại thời điểm người dùng yêu cầu dừng test; xem Git log/status để biết WIP checkpoint mới nếu có.
5. Không tạo thêm ảnh để giải quyết các việc trên. Chưa cần gameplay mới, animation, sprite nhiều hướng hoặc audio thu âm.

## Khi người dùng cho tiếp tục A2

Đọc plan A2 và source diff hiện tại → chốt lỗi trình bày cần thiết → kiểm tra fallback/mobile/legacy bằng UI riêng → chạy gate phù hợp → ghi report/PROGRESS/HANDOFF → commit/push và đối chiếu SHA. Giữ state/save/content `.5-r1` ổn định. Không suy ra “đã push” từ việc file nằm trong workspace.

## Không phụ thuộc phiên cũ

Các handle browser, exec session IDs và functions.store trong cuộc chat có thể hết hiệu lực. Mọi input cần tiếp tục đã có trên filesystem. Browser QA phải dùng API computer-use đã được cung cấp, không tự nối CDP hoặc đọc hidden app state. Dùng file docs này làm điểm bàn giao, không cần transcript cũ.

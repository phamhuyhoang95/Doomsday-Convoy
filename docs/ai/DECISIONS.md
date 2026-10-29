# Quyết định kiến trúc cần giữ

## 1. Engine là nguồn sự thật

Mọi gameplay mutation qua GameCommand/processCommand. Input state không bị mutate; command không hợp lệ giữ nguyên state/tick/RNG/log/events. Authority do adapter tin cậy truyền riêng, không lấy quyền từ body command.

Core/world/combat/narrative không import React/DOM/storage/network/clock. Engine dùng seeded RNG riêng; không Math.random/Date.now/eval. UI và CLI đều dùng cùng API.

## 2. Content là dữ liệu có kiểm tra

Event/skill/quest/anomaly dùng schema và operator allowlist. ID ổn định, refs được validate. Resource costs là giao dịch không âm; không giấu chi phí trong negative reward. Thêm một event/skill thông thường không đòi sửa engine.

Quest hợp đồng dựa facts/knowledge/ownership/status/access, có alternate khi NPC chết, kỳ vật đổi chủ hoặc địa điểm bị phong tỏa. Không dùng event ID như chuỗi tuyến tính duy nhất.

## 3. Replay và compatibility

Save có schema version, initial seed/RNG state, snapshot và accepted command log. Load replay để so snapshot. Đây là kiểm tra integrity/debug, không phải chữ ký chống gian lận.

R1 thay hành vi theo `campaign.operations`, giữ bundle `.4` và semantics legacy để genuine fixtures từ code Git `8f987d7` vẫn replay được. Fields mới optional additive trong state/save v3. Cấu hình train/stance là 0 tick nhưng vẫn log/replay.

Thay gameplay balance/rules phải đánh giá content version/legacy path. Thay ảnh A2 dùng presentation catalog để tránh đổi rule bundle và save. Không xóa archive hoặc fixtures chỉ để test pass.

## 4. Sự thật và kiến thức khác nhau

World facts lưu điều đã xảy ra dù người chơi chưa biết. Knowledge chỉ chứa phần khám phá. NPC Tro Tàn có clock/goal thật, có thể lấy Mắt gương trước người chơi. UI không tự cấp knowledge để mở lựa chọn.

## 5. Combat và quyền sở hữu

Damage dùng RNG state; preview dùng cùng formula. Enemy AI/vehicle damage có hậu quả trong transaction. Chỉ actor tham gia trận hiện tại là target hợp lệ. Encounter chợ có facts riêng, không giải nhầm arc Tro Tàn.

Artifact có definition bất biến và instance owner duy nhất. Victory/loot/trade/surrender chuyển instance thật; capture/finish thay status/facts và ảnh hưởng kết cục.

## 6. Art tách khỏi game rules

Ảnh không có HUD/chữ/nút baked-in. Map art chỉ là nền; graph/route/marker/tương tác thuộc UI/engine. PNG master giữ ở art/, bản web ở public/, stable IDs trong client catalog. Mất hình phải fallback và game vẫn chạy.

Built-in image_gen là cách tạo/chỉnh nội dung raster đã dùng; không tự chuyển sang API/CLI cần key. sips chỉ thực hiện resize/encode kỹ thuật. Xe giữ alpha thật. Prompt, nguồn và revision được ghi trong receipts; không generate lại hàng loạt khi master đã đủ.

## 7. Giới hạn scope

MVP không có online multiplayer, persistent server, marketplace hoặc AI runtime. A2 là bộ art tĩnh; không tự mở animation/multi-direction sprites/voice/soundtrack/gameplay mới. Mục tiêu 30–60 phút cần human playtest, không được suy ra từ bot.

## 8. Evidence và bàn giao

Test pass phải gắn với code/content checkpoint thực tế. Simulation R1 không phải simulation mới của A2. Có ảnh master không đồng nghĩa đã tích hợp/QA/push. Khi người dùng dừng test, ghi phần chưa xác minh và dừng; không chạy lại để làm báo cáo trông hoàn chỉnh.

## 9. Đại tu Argon được ủy quyền — 2026-10-29

Người dùng đã yêu cầu triển khai cả combat/UI/media mới. New game dùng bundle `0.2.0-campaign.1-argon`; optional tactics trong state/save v3 chọn resolver mới, `.4`/`.5-r1` chọn `legacy-engine.ts` giữ nguyên. Thu một giờ khi mở encounter; lượt/hậu chiến tactical 0 giờ, cooldown theo lượt actor. Slots Argon tách riêng, không migrate hành trình cũ ngầm. Pixi chỉ presentation; chưa thay source of truth. Atlas/nền/nhạc thuộc O1; ngoại lệ phạm vi này không tự mở server/AI runtime. Chi tiết [plan](../plans/ARGON_COMBAT_UI_OVERHAUL.md), [checkpoint](../reports/ARGON_O1_IMPLEMENTATION.md).

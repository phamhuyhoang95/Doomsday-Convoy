# Chương chơi, Hồi Chuông Số Không và con đường siêu phàm

2026-10-29; baseline `94cbfbe`. Người dùng yêu cầu tiếp tục: hệ thống hóa màn chơi, dùng Google Flow cho cinematic, xây lore mở rộng để khám phá nguồn gốc tận thế/quỷ dị, triển khai kỹ năng siêu phàm.

## Sản phẩm

- Ba chương dùng đủ 8 địa điểm đang có: Rời thành phố / Thánh An / Vành đai Bắc Sơn. Mỗi chương có câu hỏi, mục tiêu, điểm đến, dấu mốc và manh mối; UI chỉ công bố chứng cứ đã thu được. Không gọi map chưa code là màn chơi đã có.
- Canon tác giả và timeline trong docs/game/LORE_BIBLE.md; 6 hồ sơ điều tra trong game mở bằng hành động/facts, có nguồn và phân biệt chứng cứ với suy luận. Các nội dung mới nối với chuông, gương, radio, nước và Tro Tàn hiện có.
- 4 pathway × 3 bậc (9→8→7). Thức tỉnh/thăng bậc qua command ngoài combat: XP tích lũy trừ spentXp riêng, di vật chung, vật tư và knowledge gate; không sửa giảm XP làm hỏng training point balance. Không đổi/ngạch lai trong slice này.
- Skill là data qua operator chung: heal/fury khi cầm bleed, barrier/partial reflect, corpse AoE, armor ignore/stun, swap/evade, vehicle support/inversion. Không switch theo skill ID trong React. Những khác biệt cân bằng so Argon phải ghi rõ.
- Một clip Flow mở đầu; tải master/receipt, encode bản web, nối opening có skip/fallback. Ưu tiên đúng việc tạo video bằng Flow, không gọi clip composition cũ là Flow. Không mua credits/bật API billing.

## Version và contract

Bundle mới `0.3.0-campaign.1-resonance`, slots resonance-*; giữ Journey/O1/R1/.4. State/save v3 optional additive: actor.pathway và campaign.occultRemnants chỉ có ở bundle mới. Command ascend-pathway 0 world hour, không dùng được trong combat; rejected command nguyên tử. Lựa chọn truyện vẫn tiêu giờ/vật tư theo nền hiện tại.

Bậc 9/8/7 tiêu riêng 10/25/45 XP khả dụng và 1/1/2 di vật. Gate bậc 9: hồ sơ thức tỉnh; bậc 8: chứng cứ mạng chuông Thánh An; bậc 7: hồ sơ lưu trữ Bắc Sơn. Không cho học skill cấp cao bằng cách gửi command trực tiếp. Di vật/XP lấy bằng event/investigate có giới hạn; cấm farm lặp.

## Kiểm chứng

Tests cho atomic rejection, không giảm XP/đổi points, tier/ownership/knowledge gates, skills/status/corpse/lifecycle/xe/reflect không lặp và save/replay. Giữ suites legacy. Validator paths/skills/facts/chapter refs, batch campaign vừa đủ. Browser thức tỉnh → skill combat, codex khóa/mở, chapter objectives, clip play/skip/fallback và mobile. Lưu nguồn Flow/prompt/chi phí thật nếu UI cung cấp. Còn cần human playtest cân bằng/nhịp truyện.

## Kết quả đợt triển khai

Đã có 3 chương/6 hồ sơ/4×3 bậc/12 skill, một clip Flow dùng hai ảnh dự án và UI/command thật. 17 kiểm thử mới pass; full check cuối146/146tests + validators/TS/build pass. 48 runs không kẹt/rejected và replay khớp. Các timeout sớm trong phiên và đối chiếu baseline được ghi trong báo cáo; reduced-motion/thiết bị thật và cân bằng còn chờ playtest. Chi tiết, artifact, compatibility và phần ngoài scope tại [báo cáo](../reports/RESONANCE_IMPLEMENTATION.md).

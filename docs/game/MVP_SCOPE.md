# MVP v0.1 — phạm vi và acceptance

Đây là scope MVP gốc. R1 và art A1/A2 là các đợt mở rộng được người dùng yêu cầu sau đó. Trạng thái mới nhất nằm trong [HANDOFF](../ai/HANDOFF.md) và [PROGRESS](../status/PROGRESS.md).

Nguồn kế hoạch chi tiết: PHASE_PLANS.md. Trạng thái/bằng chứng: PROGRESS.md.

## Bao gồm khi hoàn tất Phase 5

- Chiến dịch ba màn, 8 địa điểm, khoảng 12 event.
- 3 nhân vật ban đầu, 1 NPC convoy, 1 anomaly có rule.
- 4 skills, 2 artifacts, 5 resource types.
- Data driven events/conditions/effects/story contracts có validation và fallback.
- Turn based combat, attack/defend/skill/retreat/negotiation/surrender/capture.
- World graph, costs/risks, NPC goals, ownership, fact ledger tách knowledge.
- Menu/map/dashboard/events/characters/inventory/combat/journal/save-load/ending UI.
- Deterministic replay, versioned save/migration, multi-seed bot report, automated tests theo 14 nhóm yêu cầu.
- Asset registry với fallback; không yêu cầu hình/âm thanh do AI tạo.

## Không bao gồm

Online multiplayer, persistent server, marketplace, AI runtime, procedural campaign không giới hạn hoặc hình ảnh tự sinh. Authoritative-server readiness nghĩa là core thuần + authority/command boundary, không phải server đã triển khai.

## Acceptance

Phase 0: cài/build/test runner hoạt động. Phase 1: hành trình headless với RNG, travel/domain events, save/load/replay và tests. Phase 2: data events/contracts cập nhật facts/quests. Phase 3: combat/ownership/NPC/anomaly có hậu quả. Phase 4: browser chơi hết ba màn. Phase 5: full content/QA, thắng hoặc thua hợp lệ, replay được, không softlock trong tập tuyến/seed đã kiểm thử.

Thời lượng 30–60 phút là mục tiêu thiết kế; chỉ xác nhận sau human playtest. Không suy ra thời lượng từ số turn hay tốc độ bot.

## Trạng thái giao hàng 2026-10-28

Phase 0–5 đã triển khai và qua các gate tự động/browser được ghi trong QA_REPORT và PROGRESS. Bản này có đủ nội dung giới hạn trên, 6 kết cục đến nơi trú và các thất bại hợp lệ. Những giới hạn về thời lượng, cân bằng, placeholder assets, audio và online services được công khai trong QA_REPORT.

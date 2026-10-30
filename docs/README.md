# Tài liệu dự án LAST CONVOY

Đây là thư mục tài liệu chính thức để người hoặc AI mới hiểu và tiếp tục dự án mà không cần đọc lại cuộc chat. `AGENTS.md` và README ở root là điểm vào; các tài liệu root cũ chỉ chuyển tiếp tới đây. README trong `art/asset-pack-a1/` được giữ cạnh gói ảnh để gói có thể dùng độc lập; nó cũng được liên kết bên dưới.

## AI mới đọc trước

| Tài liệu | Mục đích |
|---|---|
| [START_HERE](ai/START_HERE.md) | Thứ tự nhận việc, nhận diện scope và trạng thái |
| [HANDOFF](ai/HANDOFF.md) | Yêu cầu người dùng mới nhất, việc đang dở, quyền tiếp tục QA |
| [PROGRESS](status/PROGRESS.md) | Checkpoint hiện tại, bằng chứng và gate còn mở |
| [PROJECT_MAP](ai/PROJECT_MAP.md) | Source tree, entry points, lệnh và runtime |
| [DECISIONS](ai/DECISIONS.md) | Những quyết định cần giữ khi sửa dự án |
| [WORKFLOW](ai/WORKFLOW.md) | Quy trình plan/code/gate/review/docs/Git và bàn giao |

## Thiết kế và kỹ thuật

- [LORE_BIBLE](game/LORE_BIBLE.md): canon Hồi Chuông Số Không, cơ chế quỷ dị và hướng mở rộng.
- [GAME_BIBLE](game/GAME_BIBLE.md): thế giới, vòng chơi và ngữ điệu.
- [MVP_SCOPE](game/MVP_SCOPE.md): phạm vi và acceptance Phase0–5.
- [ARCHITECTURE](engineering/ARCHITECTURE.md): commands/state, replay, world/narrative/combat/persistence.
- [CONTENT_GUIDE](engineering/CONTENT_GUIDE.md): thêm event/quest/skill/artifact/region/encounter bằng data.
- [ASSET_PIPELINE](assets/ASSET_PIPELINE.md): master → web derivative → catalog → client và QA ảnh.
- [GOOGLE_MEDIA_PRODUCTION](assets/GOOGLE_MEDIA_PRODUCTION.md): đề xuất voice/nhạc/clip, Flow Pro, Cloud credits và giá/giới hạn đã tra nguồn; chưa sản xuất.
- [ARGON_MEDIA_PLAN](assets/ARGON_MEDIA_PLAN.md): phạm vi ảnh/pose, animation, SFX/ambience/nhạc, voice/clip tùy điều kiện; nguồn sản xuất, sequencer/audio mix và gate O1; đã có gói media đầu tiên, còn duyệt chất lượng.

## Kế hoạch trước triển khai

- [LORE_CHAPTERS_PATHWAYS](plans/LORE_CHAPTERS_PATHWAYS.md): 3 chương, hồ sơ điều tra, 4 con đường và cinematic tham chiếu.

- [JOURNEY_FEEL_AND_AUTO](plans/JOURNEY_FEEL_AND_AUTO.md): cinematic travel, auto combat và slice lựa chọn có hậu quả ở chặng sau.

- [ARGON_COMBAT_UI_OVERHAUL](plans/ARGON_COMBAT_UI_OVERHAUL.md): phương án thay toàn bộ UI và combat theo định hướng Argon mới của người dùng; luật đề nghị, asset, compatibility và các đợt triển khai; O0/O1 đã có code, O2–O4 còn mở.
- [PHASE_PLANS](plans/PHASE_PLANS.md): Phase0–5 đã triển khai.
- [PLAYABILITY_PLAN](plans/PLAYABILITY_PLAN.md): R1 theo phản hồi game sơ sài.
- [R2_UPGRADE_PLAN](plans/R2_UPGRADE_PLAN.md): Đợt nâng cấp toàn diện R2 (Game feel, Combat depth, Narrative polish, Survival tension).
- [R4_GAMEPLAY_REDESIGN](plans/R4_GAMEPLAY_REDESIGN.md): kế hoạch và đợt triển khai slice Chợ mất điện; thời lượng 20–30 phút và chiến dịch 65–90 phút còn là mục tiêu thử nghiệm.
- [ASSET_PLAN](plans/ASSET_PLAN.md): bộ mẫu A1.
- [ASSET_PRODUCTION_PLAN](plans/ASSET_PRODUCTION_PLAN.md): A2 đang chốt.

## Báo cáo và lịch sử

- [CLAUDE_REVIEW_BRIEF](reports/CLAUDE_REVIEW_BRIEF.md): bản tổng hợp hiện trạng, giới hạn và trọng tâm để Claude review/cải tiến (30/10/2026).

- [RESONANCE_IMPLEMENTATION](reports/RESONANCE_IMPLEMENTATION.md): chức năng lore/pathway/Flow, 146 tests pass, 48 runs và giới hạn playtest.

- [JOURNEY_FEEL_AND_AUTO](reports/JOURNEY_FEEL_AND_AUTO.md): clip travel, auto, arc liên địa điểm, 129 tests/48 runs và giới hạn thực tế.

- [ARGON_O1_IMPLEMENTATION](reports/ARGON_O1_IMPLEMENTATION.md): combat/UI/media đầu tiên, 120 tests, 96 simulation runs, ảnh QA và giới hạn thực tế.

- [CONCEPT_REDESIGN_REVIEW](reports/CONCEPT_REDESIGN_REVIEW.md): review bộ đề xuất `docs 2`/7 concept trên baseline R4.1; findings, hướng mỹ thuật và lộ trình UI đề nghị, chưa triển khai redesign.
- [R4_BASELINE](reports/R4_BASELINE.md): audit source/save/audio và gate baseline R4.0.
- [R4_ARCHITECTURE_REVIEW](reports/R4_ARCHITECTURE_REVIEW.md): quyết định compatibility/core/time cho slice R4.

- [QA_REPORT](reports/QA_REPORT.md): checkpoint Phase5, content `.4`.
- [PLAYABILITY_REPORT](reports/PLAYABILITY_REPORT.md): R1, content `.5-r1`, 103 tests và batch2.400 runs.
- [PROGRESS_HISTORY](status/PROGRESS_HISTORY.md): bản lưu toàn bộ nhật ký cũ; không lấy các dòng NEXT ở đó làm việc tiếp theo.

## Dữ liệu đi kèm cần giữ

- [Flow receipt](../art/flow-cinematics/receipt.json), [prompt tham chiếu](../art/flow-cinematics/reference-prompt.txt), [script encode](../scripts/prepare-flow-opening.py).

- [Argon O1 manifest](../art/argon-o1/manifest.json), [prompts](../art/argon-o1/prompts.json), [audio preparation](../scripts/prepare-argon-audio.py).

- [Gói A1](../art/asset-pack-a1/README.md), [manifest](../art/asset-pack-a1/manifest.json), [prompts](../art/asset-pack-a1/prompts.json).
- [A2 jobs](../art/production-a2/jobs.json), [prompt chính xác](../art/production-a2/prompts-final.json), [build manifest](../art/production-a2/build-manifest.json); receipts ở `art/production-a2/receipts/`.
- [Catalog client](../src/client/art/catalog.json), [gallery](http://127.0.0.1:4173/art/a2/gallery.html).
- [R1 simulation](../artifacts/r1-simulation.json); ảnh browser QA nằm trong `artifacts/`.
- [Fixture save v0.1 thật](../tests/fixtures/v01-saves.json), [bundle legacy](../src/content/archive/campaign-v4.json).

Chỉ sửa nội dung tại đường dẫn chính thức trong docs. Khi chuyển file, giữ liên kết chuyển tiếp nếu đường dẫn cũ đã được dùng; cập nhật link tương đối. Nội dung lịch sử cần ghi rõ checkpoint/content version, tránh trộn số test cũ với trạng thái mới.

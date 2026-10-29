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
| [WORKFLOW](ai/WORKFLOW.md) | Phân công Astral/Sol/Terra, quy trình plan/code/gate/review/docs/Git và bàn giao |

## Thiết kế và kỹ thuật

- [GAME_BIBLE](game/GAME_BIBLE.md): thế giới, vòng chơi và ngữ điệu.
- [MVP_SCOPE](game/MVP_SCOPE.md): phạm vi và acceptance Phase0–5.
- [ARCHITECTURE](engineering/ARCHITECTURE.md): commands/state, replay, world/narrative/combat/persistence.
- [CONTENT_GUIDE](engineering/CONTENT_GUIDE.md): thêm event/quest/skill/artifact/region/encounter bằng data.
- [ASSET_PIPELINE](assets/ASSET_PIPELINE.md): master → web derivative → catalog → client và QA ảnh.

## Kế hoạch trước triển khai

- [PHASE_PLANS](plans/PHASE_PLANS.md): Phase0–5 đã triển khai.
- [PLAYABILITY_PLAN](plans/PLAYABILITY_PLAN.md): R1 theo phản hồi game sơ sài.
- [R2_UPGRADE_PLAN](plans/R2_UPGRADE_PLAN.md): Đợt nâng cấp toàn diện R2 (Game feel, Combat depth, Narrative polish, Survival tension).
- [ASSET_PLAN](plans/ASSET_PLAN.md): bộ mẫu A1.
- [ASSET_PRODUCTION_PLAN](plans/ASSET_PRODUCTION_PLAN.md): A2 đang chốt.

## Báo cáo và lịch sử

- [QA_REPORT](reports/QA_REPORT.md): checkpoint Phase5, content `.4`.
- [PLAYABILITY_REPORT](reports/PLAYABILITY_REPORT.md): R1, content `.5-r1`, 103 tests và batch2.400 runs.
- [PROGRESS_HISTORY](status/PROGRESS_HISTORY.md): bản lưu toàn bộ nhật ký cũ; không lấy các dòng NEXT ở đó làm việc tiếp theo.

## Dữ liệu đi kèm cần giữ

- [Gói A1](../art/asset-pack-a1/README.md), [manifest](../art/asset-pack-a1/manifest.json), [prompts](../art/asset-pack-a1/prompts.json).
- [A2 jobs](../art/production-a2/jobs.json), [prompt chính xác](../art/production-a2/prompts-final.json), [build manifest](../art/production-a2/build-manifest.json); receipts ở `art/production-a2/receipts/`.
- [Catalog client](../src/client/art/catalog.json), [gallery](http://127.0.0.1:4173/art/a2/gallery.html).
- [R1 simulation](../artifacts/r1-simulation.json); ảnh browser QA nằm trong `artifacts/`.
- [Fixture save v0.1 thật](../tests/fixtures/v01-saves.json), [bundle legacy](../src/content/archive/campaign-v4.json).

Chỉ sửa nội dung tại đường dẫn chính thức trong docs. Khi chuyển file, giữ liên kết chuyển tiếp nếu đường dẫn cũ đã được dùng; cập nhật link tương đối. Nội dung lịch sử cần ghi rõ checkpoint/content version, tránh trộn số test cũ với trạng thái mới.

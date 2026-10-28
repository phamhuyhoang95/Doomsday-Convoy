# Bản đồ dự án cho AI mới

## Sản phẩm và stack

LAST CONVOY: chiến thuật theo lượt + sinh tồn + quỷ dị có quy tắc. Chiến dịch ba màn: rời thành phố → bệnh viện → tranh đoạt kỳ vật. React/Vite chỉ là adapter UI; engine TypeScript thuần chạy headless được.

TypeScript strict, Zod, Vitest, React, Vite, tsx. Không có server multiplayer, AI sinh content runtime hoặc persistent backend. Node 24 là runtime gate; package.json là nguồn chính xác cho versions/scripts.

## Source tree

| Đường dẫn | Vai trò / entry point |
|---|---|
| `src/core/processor.ts` | `processCommand`: authority/validation → clone → transaction → events/log/invariants |
| `src/core/state.ts`, `state-schema.ts` | Khởi tạo từ seed, schema/version/state |
| `src/core/rng.ts`, `replay.ts` | Seeded RNG và replay accepted log |
| `src/world/` | Graph, route costs/risk, NPC goal/clock |
| `src/narrative/` | Condition/effect allowlists, event director, Story Contracts, facts/knowledge |
| `src/combat/` | Turn order, enemy AI, attack/skills/guard/heal, capture/loot/ownership |
| `src/expedition/` | Recon cache/intel, nghỉ/sửa xe, XP/upgrades/stances |
| `src/content/campaign.ts` | Bundle campaign hiện tại; references đến content modules |
| `src/content/world.ts` | Foundation graph 8 locations / 11 routes, characters cơ bản |
| `src/content/archive/` | Bundle legacy `.4` cho save cũ |
| `src/assets/registry.ts` | Stable asset kinds/IDs/fallback; không phụ thuộc React |
| `src/read-models/` | Cost/skill/effect previews và transition report thuần TS |
| `src/persistence/` | Save envelope/migration/replay verification, injected storage, compatible slots |
| `src/simulation/`, `scripts/` | Headless scenarios/bots/validators/CLI |
| `src/client/App.tsx`, `use-game.ts` | Màn hình, dispatch, localStorage, active definition |
| `src/client/art/` | A2 presentation catalog/lookup; không tham gia gameplay replay |
| `src/client/components/` | Map/event/crew/combat/inventory/journal/report controls |
| `src/client/audio.ts` | Web Audio procedural và preferences ở client |
| `art/asset-pack-a1/`, `art/production-a2/` | PNG master, prompts, receipts và manifest |
| `public/art/a2/` | 29 ảnh web, catalog công khai và gallery standalone |
| `tests/` | Engine/quest/combat/campaign/R1 tests và legacy fixtures |
| `artifacts/` | Simulation JSON và ảnh browser QA; không chứa save cá nhân để commit |

## Luồng một hành động

Người chơi bấm UI → payload GameCommand → useGame gắn issuer/command ID → processCommand nhận trusted authority → trả state/events hoặc rejection nguyên tử → UI render state mới và report/audio → adapter lưu đúng slot. React không tự sửa HP/resource/ownership hoặc chọn outcome.

## Runtime và save

- Một tick là một giờ thế giới; không có background timer gameplay.
- State/save v3, engine 0.1.0. Foundation `0.1.0-foundation.1`, campaign R1 `0.1.0-campaign.5-r1`, legacy `0.1.0-campaign.4`.
- R1 có slots `r1-autosave`/`r1-manual`; legacy có slots riêng. `loadCompatibleSlot` chọn đúng bundle. Corrupt R1 không âm thầm fallback.
- LocalStorage theo browser/origin. `127.0.0.1:5173` khác `127.0.0.1:4173`; không ghi đè save production để QA.

## Lệnh tham khảo khi được phép chạy

Xem trạng thái dừng QA trong HANDOFF trước. Lệnh thường: `npm run dev`, `preview`, `check`, `demo`, `demo:campaign`, `simulate:campaign`, `validate:art`, `art:build`. Có fallback Node 24: `npm exec --yes --package=node@24 -- npm run <script>`.

Dev mặc định 5173; preview build 4173. `npm run preview` đọc `dist`, không hot-reload source; chỉ source dev có HMR. Asset gallery HTTP: `/art/a2/gallery.html`. Mobile harness dev: `/qa/mobile.html` (iframe390 × 844, không phải thiết bị thật).

Không có yêu cầu dùng API key để chạy game hoặc dùng built-in image_gen. Không đưa secret vào repo hoặc docs.

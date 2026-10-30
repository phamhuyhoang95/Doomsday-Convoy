# LAST CONVOY — quy ước cho coding agent

Đây là hướng dẫn làm việc bắt buộc cho AI trong repository LAST CONVOY. Nội dung kỹ thuật, kế hoạch, báo cáo và bàn giao chính thức nằm trong `docs/`. Các file Markdown cũ ở root (trừ README/AGENTS) là liên kết chuyển tiếp; không ghi nội dung mới vào đó.

## Bắt đầu một phiên mới

Đọc theo thứ tự trước khi sửa code hoặc chạy lệnh:

1. [START_HERE](docs/ai/START_HERE.md) — cách tiếp nhận dự án.
2. [HANDOFF](docs/ai/HANDOFF.md) — yêu cầu người dùng mới nhất, việc đang dở, lệnh được phép/chưa được phép.
3. [PROGRESS](docs/status/PROGRESS.md) — trạng thái hiện tại và gate đã xác minh.
4. [PROJECT_MAP](docs/ai/PROJECT_MAP.md), [ARCHITECTURE](docs/engineering/ARCHITECTURE.md) — vị trí code và ranh giới module.
5. Kế hoạch/guide liên quan trong [mục lục docs](docs/README.md).

Sau đó đọc `git status --short` và diff của vùng sắp sửa. Không giả định một hạng mục còn thiếu chỉ vì chưa thấy trong chat. Đối chiếu HANDOFF/PROGRESS với Git và artifact hiện có; phân biệt trạng thái mới nhất với ghi chú lịch sử, không khởi động lại phase đã triển khai.

Nếu HANDOFF ghi người dùng đang dừng test/QA, không tự chạy test, build, validator, simulation, browser QA hoặc tạo ảnh tiếp. Chỉ tiếp tục phần người dùng đang yêu cầu; yêu cầu tiếp tục mới hơn của người dùng sẽ cập nhật trạng thái đó.

## Quy trình làm việc

Thực hiện yêu cầu bằng phiên hiện tại; không có phân công model hay mức suy luận bắt buộc. Chỉ dùng thêm agent khi người dùng yêu cầu hoặc có lý do cụ thể giúp hoàn thành công việc, và giới hạn số agent theo nhu cầu thực tế.

- Trước đợt lớn, ghi kế hoạch trong `docs/plans/`: hiện trạng, mục tiêu, scope, phương án, các bước, compatibility, kiểm chứng và rủi ro.
- Điều tra source trước khi kết luận; phân biệt dữ kiện với giả thuyết. Review diff về correctness, deterministic/replay/save compatibility, softlock và chất lượng gameplay/UI. Test pass không thay cho review hành vi.
- Khi kiểm chứng, ghi lệnh, runtime, commit/diff, kết quả thật và giới hạn. Không chạy QA nếu người dùng đã dừng QA.
- Findings ghi vị trí, tình huống, hậu quả, mức ưu tiên và cách xác nhận đã sửa. Cập nhật HANDOFF/PROGRESS khi bàn giao.
- Nếu có nhiều người cùng làm, mỗi file chỉ có một người ghi và không điều khiển chung browser/tab hoặc working tree đang được kiểm tra.

Quy trình bàn giao chi tiết: [WORKFLOW](docs/ai/WORKFLOW.md).

## Phạm vi và kiến trúc

- Đọc [README](README.md), [ARCHITECTURE](docs/engineering/ARCHITECTURE.md) và [MVP_SCOPE](docs/game/MVP_SCOPE.md) trước khi mở rộng tính năng.
- Lập kế hoạch chi tiết trước mỗi phase/đợt lớn trong `docs/plans/`, rồi cập nhật `docs/status/PROGRESS.md` sau mỗi phần lớn. Xem [PHASE_PLANS](docs/plans/PHASE_PLANS.md) và [A2 plan](docs/plans/ASSET_PRODUCTION_PLAN.md). Không tự mở scope ngoài yêu cầu.
- TypeScript strict. Giữ `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` và các kiểm tra unused.
- `src/core/` là nguồn sự thật: mọi thay đổi gameplay đi qua `processCommand`.
- Core/world không import React, DOM, filesystem, storage, network hay client. Không đọc clock hệ thống.
- Không dùng `Math.random`, `Date.now`, UUID ngẫu nhiên hay `eval` trong engine. Mọi RNG dùng `src/core/rng.ts`.
- Dùng ID ổn định cho content. Không nhúng asset path hay logic từng màn vào core.
- Content là dữ liệu; thay đổi schema/rules phải xem xét tương thích save/replay và tăng version phù hợp.
- Command bị từ chối không thay đổi state, tick, RNG, log hay domain events.
- Authority là tham số do adapter tin cậy truyền vào; không lấy quyền từ body command ở server tương lai.
- Không thêm server multiplayer, content AI runtime, Event/Quest/Combat giả hoặc UI mô phỏng lựa chọn văn bản.
- State/save hiện là v3, engine 0.1.0; client mặc định `0.4.0-campaign.1-lamplight`. Giữ Resonance/Journey/O1/R1 và bundle `.4` cho save cũ. Đọc [DECISIONS](docs/ai/DECISIONS.md) trước khi sửa version/rules.
- World facts là sự thật khách quan; player knowledge là phần đã khám phá. Quest giải bằng contract/facts/ownership/alternate, không khóa bằng chuỗi event ID.

## Bảo toàn code/content

- Kiểm tra Git diff và hiện trạng trước khi sửa. Không reset, xóa hoặc ghi đè công việc chưa đánh giá.
- Không thay ID hoặc xóa content cũ âm thầm. Ghi migration/thay version khi cần.
- Không sửa file lock thủ công. Không commit node_modules, dist, .env, private keys hoặc save cá nhân.
- Hàm engine thuần, không mutate input. Thay đổi resource là giao dịch nguyên tử, không cho số âm.
- Thêm test hành vi cho rules/bug quan trọng; không viết test chỉ lặp lại chi tiết implementation.
- Không khai báo đã build/test thành công khi chưa chạy. Ghi rõ giới hạn và lỗi còn tồn tại.
- Không tạo lại ảnh A1/A2 đã có. Đọc [ASSET_PIPELINE](docs/assets/ASSET_PIPELINE.md), jobs/receipts/build-manifest trước. Giữ PNG master, dùng file web nhỏ cho client; giữ alpha xe.
- Catalog A2 ở `src/client/art/catalog.json` chỉ phục vụ presentation. Không đưa URL/React vào engine hoặc thay content version chỉ để thay ảnh. Game phải còn fallback khi ảnh lỗi.
- Skill mới thông thường dùng operator hiện có; event mới dùng data/schema. Không switch rules theo skill/event ID trong React.

## Môi trường và lệnh tham khảo

Workspace đang dùng `/Users/tdt/Desktop/GameOL`, shell zsh. Dùng Node 24 theo `.nvmrc`; Node hệ thống trước đây là 23 và không phải runtime cho gate Vitest 4. Khi PATH thiếu công cụ, dùng:

```sh
export PATH=/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin
npm exec --yes --package=node@24 -- npm run dev
```

Dev 5173 và preview4173 có localStorage riêng. Không ghi đè save của người dùng để QA; dùng origin/slot QA riêng và thao tác qua UI. Không dựa vào biến REPL hoặc session ID từ chat cũ để tiếp tục.

## Lệnh kiểm tra

Danh sách dưới chỉ là tham khảo **khi người dùng đã cho tiếp tục QA**. Luôn đọc HANDOFF trước khi chạy. `npm run check` hiện chạy world/content/art validators, Vitest, TypeScript và production build.

```sh
npm ci
npm run check
npm run validate:art
npm run art:build
npm run demo -- --seed 42 --path direct
npm run simulate -- --seeds 1000 --output artifacts/simulation.json
```

`art:build` dùng macOS sips để resize/encode, không cần cho runtime hoặc CI nếu bản web đã có. Chi tiết preset/gates trong ASSET_PIPELINE. `demo` phải thắng, round trip save/load và replay tương đương. Simulation phải báo rõ thắng/thua/softlock; không xem việc bot chưa đạt mục tiêu là thắng. Không chạy lại batch lớn nếu không có thay đổi hoặc lo ngại liên quan.

## Bàn giao khi dừng hoặc hết context

- Cập nhật `docs/ai/HANDOFF.md` và `docs/status/PROGRESS.md` cùng lúc: yêu cầu mới nhất, đã làm, file quan trọng, gate thật, việc chưa làm, bước đầu tiên khi tiếp tục.
- Phân biệt code/ảnh đã có, đã được kiểm tra, đã commit và đã push. WIP không được báo thành hoàn tất.
- Để prompt/receipt/manifest và source trong workspace. Không coi `$CODEX_HOME/generated_images`, browser tabs hoặc biến nhớ công cụ là nơi lưu duy nhất.
- Giữ báo cáo cũ trong `docs/reports/` hoặc lịch sử trong `docs/status/PROGRESS_HISTORY.md`; các dòng NEXT lịch sử không phải lệnh hiện tại.
- Tài liệu chính thức mới phải có liên kết từ `docs/README.md`. Xem [WORKFLOW](docs/ai/WORKFLOW.md) để cập nhật docs và ghi checkpoint.

## Giao hàng

- Tài liệu bằng tiếng Việt; identifier và code bằng tiếng Anh.
- Báo cáo chức năng thật, file chính, lệnh đã chạy, kết quả, cách chạy và giới hạn sau mỗi phase.
- Repository đã được người dùng cho phép đồng bộ với `origin`; dùng commit rõ nghĩa và push thường, không force push.
- Có thể lưu WIP checkpoint khi cần bảo toàn công việc, nhưng phải ghi rõ QA đang dừng/chưa xong. Không tự đánh dấu A2 hoàn tất chỉ vì đã push ảnh.

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

## Phân công model bắt buộc

Đây là phân công do người dùng chỉ định cho dự án. **Astra mặc định dùng `medium`** cho điều phối, phân chia task, lập plan thông thường và review thường lệ. **Chỉ chuyển Astra sang `high` khi review kiến trúc quan trọng hoặc ra quyết định quan trọng.** Sol và Terra tiếp tục dùng `high`. Khi giao việc phải chọn rõ model và effort, không chỉ viết tên vai trò trong prompt.

| Vai trò | Model ID | Trách nhiệm chính | Sản phẩm bàn giao |
|---|---|---|---|
| **Astra Medium — điều phối mặc định** | `gpt-6-astra`, effort `medium` | Điều phối mục tiêu/ưu tiên; đề xuất ý tưởng; chia task; lập plan thông thường; review thường lệ; tổng hợp và chốt tiến trình | Plan, task briefs, tiêu chí nghiệm thu, findings thường lệ và trạng thái dự án |
| **Astra High — review/quyết định quan trọng** | `gpt-6-astra`, effort `high` | Review kiến trúc có ảnh hưởng lớn; đánh giá phương án và ra quyết định quan trọng trước khi triển khai | Kết luận review, phương án được chọn, lý do, rủi ro và điều kiện kiểm chứng |
| **Sol 6.1 High — triển khai** | `gpt-6.1-sol` | Viết/sửa code, content, UI, migration và tests theo plan; tích hợp thay đổi; xử lý findings; chuẩn bị triển khai trong phạm vi được giao | Diff chạy được, danh sách file thay đổi, giải thích hành vi và bàn giao để kiểm chứng |
| **Terra 6.1 High — điều tra và kiểm chứng** | `gpt-6.1-terra` | Điều tra source, truy vết bug, tìm kiếm thông tin/tài liệu; chạy test/build/simulation; computer use/browser QA; công cụ, dữ liệu và tác vụ hỗ trợ cần thiết | Báo cáo có file/line hoặc nguồn, bước tái hiện, lệnh và kết quả thật, logs/ảnh/artifact |

Tên “Astral” trong tài liệu cũ cũng chỉ Astra (`gpt-6-astra`). Mức effort hiện hành lấy theo bảng trên; ghi chú lịch sử dùng high không thay đổi mặc định medium.

### Astra: mục tiêu, ý tưởng, plan và review

- Là đầu mối điều phối ở mức **medium**. Chuyển yêu cầu người dùng thành mục tiêu trải nghiệm/gameplay cụ thể, scope, thứ tự ưu tiên và tiêu chí hoàn tất có thể kiểm chứng.
- Trước mỗi phase/đợt lớn, ghi plan vào `docs/plans/`: hiện trạng, vấn đề, phương án chọn, các bước/phụ thuộc, người phụ trách, file dự kiến, compatibility, kiểm chứng và rủi ro. Có thể giao Terra khảo sát trước khi chốt plan.
- Chủ động đề xuất ý tưởng mới dựa trên phản hồi, source và bằng chứng chơi: nêu lợi ích cho người chơi, chi phí, rủi ro và cách đánh giá. Ý tưởng ngoài phạm vi được ghi ở mục đề xuất của plan; không tự đưa vào triển khai.
- Review diff của Sol cùng bằng chứng Terra: correctness, deterministic/replay/save compatibility, kiến trúc, softlock, phản hồi thao tác và chất lượng gameplay/UI. Không dùng test pass thay cho review hành vi.
- Findings phải có vị trí, tình huống gây lỗi, hậu quả, mức ưu tiên và điều kiện xác nhận đã sửa. Kết luận rõ: đạt, cần sửa hoặc chưa đủ bằng chứng; ghi các giới hạn còn lại.
- Astra cũng review lại giả định trong chính plan của mình dựa trên điều tra và kết quả thực tế. Review nội bộ không phải một bước xin phép người dùng cho công việc đã được ủy quyền.

### Khi nào dùng Astra High

- Review thay đổi ranh giới module/core, command authority, tính deterministic, schema/version/migration hoặc save/replay compatibility có ảnh hưởng rộng.
- Quyết định đổi kiến trúc/stack, viết lại hệ thống, thay vòng chơi cốt lõi, mở rộng scope lớn hoặc cam kết ngân sách đáng kể so với plan đã chốt.
- Các việc điều phối hằng ngày, chia task, báo tiến độ, cập nhật docs, lập plan triển khai theo kiến trúc đã chốt và review sửa lỗi/UI cục bộ vẫn dùng **medium**. Không nâng high chỉ vì task có tên “plan” hay “review”.
- Khi chuyển high, ghi ngắn trong brief/HANDOFF: quyết định cần giải, lý do quan trọng, phương án và bằng chứng đầu vào, tiêu chí chốt. High tập trung vào quyết định/review đó; xong thì **trở lại medium để điều phối**. Không duy trì hai đầu mối điều phối độc lập.

### Sol: thực hiện plan và sửa lỗi

- Nhận task có phạm vi, file phụ trách và acceptance criteria rõ ràng; đọc code hiện có rồi triển khai theo từng phần có thể review.
- Chịu trách nhiệm chính cho thay đổi mã nguồn sản phẩm, content, tests và script được giao. Không tự mở rộng scope hoặc thay kiến trúc/rules/version vượt plan; báo phát hiện cho Astra để cập nhật plan.
- Bàn giao diff, hành vi trước/sau, cách thử và phần chưa kiểm chứng cho Terra/Astra. Khi nhận findings, sửa nguyên nhân và ghi rõ thay đổi để kiểm tra lại có mục tiêu.

### Terra: tìm hiểu, công cụ và bằng chứng

- Ưu tiên điều tra trước khi kết luận: chỉ ra source liên quan, luồng dữ liệu, nguyên nhân và phương án; phân biệt dữ kiện đã thấy với giả thuyết.
- Nghiên cứu bên ngoài dùng nguồn phù hợp và dẫn nguồn. Computer use thao tác qua công cụ được cấp, lấy trạng thái quan sát được và lưu bằng chứng có ích.
- Phụ trách thực thi checks phù hợp khi được phép: ghi command, runtime, commit/diff được kiểm tra, kết quả/exit code và lỗi còn mở. Không chạy test nếu người dùng đang dừng QA; ghi rõ phần chưa chạy.
- Có thể viết báo cáo hoặc harness/script hỗ trợ trong phạm vi Astra giao. Sửa code sản phẩm để khắc phục vấn đề mặc định chuyển cho Sol; không âm thầm sửa assertion/fixture để làm test xanh.

### Điều phối thực tế và giới hạn

- Luồng mặc định: **Astra medium xác định mục tiêu → Terra high khảo sát khi cần → Astra medium chốt plan → Sol high triển khai → Terra high kiểm chứng → Astra medium review/chốt**. Chèn **Astra high** tại bước review kiến trúc/quyết định quan trọng, rồi quay về medium. Nếu còn lỗi: Sol sửa → Terra kiểm tra phần bị ảnh hưởng → Astra review lại ở mức phù hợp.
- Người dùng cho phép dùng sub-agent theo các vai trò trên trong phạm vi task đã giao. Không cần tạo đủ ba agent cho mọi việc: sửa tài liệu điều phối nhỏ có thể do Astra làm trực tiếp; task code dùng Sol, task điều tra/QA dùng Terra.
- Khi công cụ hỗ trợ chọn model, truyền đúng ID ở bảng và effort theo vai trò: Astra điều phối `reasoning_effort: "medium"`; Astra review/quyết định quan trọng, Sol và Terra `reasoning_effort: "high"` (hoặc trường effort tương đương). Với `collaboration.spawn_agent`, override model/effort cần `fork_turns: "none"`; truyền đủ brief và đường dẫn tài liệu vì agent không nhận toàn bộ lịch sử chat.
- File này hướng dẫn điều phối, **không tự đổi model hoặc effort của phiên đang chạy**. Nếu cần chuyển effort, dùng cơ chế runtime thực sự hỗ trợ hoặc giao một task review có giới hạn cho Astra high; không giả nhận đã chuyển. Nếu thiếu model/công cụ cần thiết, báo rõ phần không khả dụng và ghi vào HANDOFF; không âm thầm thay model khác. Vẫn làm phần độc lập phù hợp với model/công cụ thực tế.
- Mặc định một Astra medium điều phối, một Sol high triển khai và một Terra high hỗ trợ; chỉ chạy song song các việc độc lập trong giới hạn runtime. Mỗi file có một người ghi tại một thời điểm. Không để nhiều agent đồng thời điều khiển cùng browser/tab, save QA hoặc thay working tree đang được kiểm tra.
- Task brief phải có mục tiêu, đầu vào/plan, file được ghi, phần không được đổi, phụ thuộc, trạng thái được phép chạy QA, tiêu chí xong và đầu ra cần trả về. Agent không tự giao việc tiếp ngoài phạm vi đó.
- Astra quản lý HANDOFF/PROGRESS, tích hợp kết quả và điều phối commit/push; worker báo kết quả về điều phối, không tự commit/push phần việc chung trừ khi được giao rõ. Giữ mọi kết quả cần tiếp tục trong repo, không chỉ trong chat.

Quy trình bàn giao chi tiết: [WORKFLOW](docs/ai/WORKFLOW.md). Model IDs lấy từ danh sách công cụ của phiên; tham khảo khái niệm effort trong [OpenAI Docs](https://developers.openai.com/api/docs/guides/reasoning).

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
- State/save hiện là v3, engine 0.1.0, campaign `0.1.0-campaign.5-r1`; bundle `.4` giữ cho save cũ. Đọc [DECISIONS](docs/ai/DECISIONS.md) trước khi sửa version/rules.
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

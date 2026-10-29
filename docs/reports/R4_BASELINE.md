# R4.0 — baseline kỹ thuật và tương thích

Ngày 2026-10-29. Snapshot kiểm tra: `9113203` (working tree sạch lúc nhận việc). Nghiên cứu source và lịch sử Git; không dùng save cá nhân, không browser/audio playtest. Những đề xuất dưới đây cần review kiến trúc trước code; thời lượng và sức hút chưa đo.

## Tương thích: phát hiện cần xử lý trước R4

- `src/persistence/save.ts:98–110, 113–164` xác minh replay cả khi lưu và tải, đòi engine/content version chính xác. `src/core/replay.ts:15–52` dựng lại state từ seed, so từng command record gồm RNG/events rồi so toàn snapshot. Vì vậy sao chép content mà vẫn thay logic chung không đủ bảo vệ replay.
- `src/content/campaign.ts:163` vẫn là `0.1.0-campaign.5-r1`. Diff Git `664d269..8caca86` cho thấy cùng ID đã đổi máu Kẻ Đói 46→58, Kẻ Rình 40→52 và giáp 1→2; `src/combat/engine.ts:55–64` đổi thứ tự lượt trừ `.4`; R2 còn đổi trạng thái combat/loot. Đây là thay đổi thực, không chỉ trình bày. `createGame` dựng roster theo content, nên ngay snapshot cũ chưa tham chiến cũng có thể không bằng state dựng lại; replay các lệnh cũ có thêm nguy cơ lệch. Chưa chạy fixture `.5-r1` lịch sử nên không khẳng định tỷ lệ hoặc khôi phục mọi bản cũ.
- Fixture thực tại `tests/fixtures/v01-saves.json` và `tests/playability.test.ts:369` là `.4` từ `8f987d7`, không chứng minh các bản R1/R2 cũ. Test/simulation tạo rồi replay trên cùng implementation chỉ chứng minh tự nhất quán hiện tại. `.4` cũng chia sẻ engine hiện hành; fixture có hạn không chứng minh mọi lịch sử `.4`.
- `src/content/registry.ts:6–10` chỉ registry definition, không chọn version logic. `src/persistence/compatible.ts:13–37` và `src/client/use-game.ts:22–25, 231–250` chỉ chia legacy/R1 bằng presence `operations`, mặc định slot `r1-*`. Thêm R4 mà tiếp tục predicate này sẽ đụng slot/definition. Save error hiện không âm thầm fallback khi slot mới hỏng; cần giữ đặc tính đó.

**Đề xuất:** đóng băng cả data lẫn hành vi quan sát được của `.4` và `.5-r1` hiện tại bằng versioned rules dispatch/adapter có ranh giới rõ; ghi fixtures snapshot/log thật, đặc biệt giữa combat, rescue, kết thúc, rồi giữ replay fixture khi thay engine. R4 cần content ID và namespace slot mới, registry ánh xạ version → definition/rules/slot tường minh; không tự migrate chuyến đang dở sang luật mới. Nếu thay state schema, version/migration phải bảo toàn representation cũ và replay; không mặc định bump engine hiện hành vì loader từ chối engine khác, cần quyết định chiến lược đa engine trước. Các bản R1/R2 trước đây cùng ID không thể phân biệt đáng tin chỉ từ version: cần fixture lịch sử và chiến lược nhận diện/khôi phục riêng, không hứa mọi save cũ tự tải được.

## Ranh giới scenario nhỏ đề xuất

Hiện `src/core/commands.ts:4–90` chưa có lệnh scene; `src/core/state-schema.ts:148–161` chưa có state nhiệm vụ; `src/core/processor.ts:96–147` tính một tick cho gần mọi hành động, trừ train/stance, rồi trừ khẩu phần và chạy world clock. Làm 5 hotspot bằng event hiện có sẽ đốt một giờ mỗi thao tác và làm rival chạy, phá nhịp đề xuất.

- Thêm definition scenario data-driven có ID, 5 node và liên kết, điều kiện/hành động, phí, trạng thái được quan sát và outcome; validation tại `src/world/schema.ts` và registry/reference validator. Các thao tác là generic operators có allowlist, không switch ID chợ trong engine hoặc React.
- State nhiệm vụ được serialize: team đúng 2 actor hợp lệ còn active, vị trí/visited node, alert hữu hạn, cargo có capacity và ownership, rescue/objective state, module đã chọn và phase/exit. Actor ở xe là phần roster còn lại; kiểm tra không trùng, không active/downed/captive sai quyền; có fallback khi thiếu đúng vai trò. Không thể travel/thoát bỏ qua giao dịch cargo/rescue.
- Lệnh enter/assign, move/interact, take/drop, resolve/escape qua `processCommand`, điều kiện và chi phí nguyên tử; rejected command không thay state/RNG/log/events. Chọn mission budget/alert rời rạc, không timer nền; chỉ quy đổi world time/tiêu hao qua quy tắc công khai tại checkpoint/exit. Chốt cách tương tác rival và combat trước code, không để command âm thầm tiêu một giờ.
- Cho hai đường khủng hoảng: combat thật hiện có và né với alert/cost/hậu quả; rút sớm hợp lệ. Giữ giao dịch ownership và fact/quest trong engine. Hai module là data có giá, giới hạn slot và tác dụng thật, không chỉ nhãn; xét tồn tại nguồn tài nguyên và đường thoát khi mất người/xe hoặc cargo đầy. Không nhầm prototype scenario với R4.2 vị trí/AP chưa được thiết kế.
- Điểm nối: `src/core/{commands,state-schema,state,events,processor,invariants}.ts`, `src/expedition/` resolver, `src/world/{schema,registry}.ts`, `src/content/` definitions, `src/narrative/` facts/contract, `src/persistence/{save,compatible}.ts`, `src/client/use-game.ts` và component scene/read model. `src/combat/engine.ts` cần contract tiếp nối mission rõ khi thắng/thua/rút; không để combat guard hiện tại (`processor.ts:74–78`) chặn lệnh exit cần thiết hoặc cho bypass.
- Gate hành vi: save/load/replay giữa mission và combat, khác seed, invalid commands giữ byte-equivalent state/RNG/events, mọi team hợp lệ, crew downed, cargo đầy/mất, cả hai lối và rút, module có và không có tài nguyên, kết quả bền sau checkpoint; kiểm tra `.4`/`.5-r1` fixtures lịch sử. Chỉ human playtest đo thời lượng và hấp dẫn.

## Audio: bằng chứng và giới hạn

`src/client/audio.ts:61–105` unlock/resume theo tương tác; `src/client/use-game.ts:47–50, 181–184, 231–245` gọi khi bắt đầu, command, tải. `audio.ts:112–160` tạo nốt bằng interval 550 ms: nhạc đường/menu thưa, hợp âm mỗi 8 bước (4,4 giây), chuông giữa; `audio.ts:162–168` master mặc định 0,4 × 0,35 = 0,14 và từng tone có gain riêng. Đây là nguyên nhân có thể làm nhạc khó cảm nhận, chưa chứng minh không nghe được trên thiết bị thực. Control chỉ có một volume chung (`AudioControl.tsx:20–30`), không có nút nghe thử hay mixer riêng; status `Đang phát` chỉ phản ánh AudioContext running (`audio.ts:100–105`), không chứng minh đã nghe thấy.

Lỗi vòng đời có thể xác định từ source: `audio.ts:112–124, 365–368` tạo interval nhưng `close()` không gọi `stopBgm()`, nên timer tồn tại sau unmount; context bị đóng và callback tiếp tục chạy/giữ instance. Cần cleanup timer và kiểm chứng mount/unmount. Chưa xác định đây là nguyên nhân phản hồi người dùng. Chưa kiểm tra phát thật, autoplay, background/resume hoặc mobile; browser QA được giao riêng.

## Gate baseline

Lệnh `npm exec --yes --package=node@24 -- npm run check` trên `9113203` kết thúc exit 1: validators world/content/art pass; Vitest 101/103 pass, hai simulation test timeout: `tests/foundation.test.ts:365` giới hạn 5 giây (báo 10,325 giây) và `tests/campaign-qa.test.ts:298` giới hạn 30 giây (báo 70,141 giây). Tổng Vitest 88,94 giây. Không có assertion thất bại được báo, nhưng timeout không chứng minh simulation đạt; chưa xác định nguyên nhân, có tải đồng thời trong phiên. `check` dừng tại test nên TypeScript/build chưa chạy. Không sửa timeout hoặc khai báo gate pass.

## Snapshot R3 trước khi sửa source

Tạo từ code Git `9113203`, Node 24, content `0.1.0-campaign.5-r1`, seed 42 trước triển khai R4:

- `src/content/archive/campaign-v5-r3.json`: JSON của `campaignDefinition` hiện hành, đã round-trip JSON qua `validateWorldDefinition`; SHA-256 `0754f6a6897d1945bc805870130fc303661e23dc95482b8d34013a33ee3e2577`.
- `tests/fixtures/r3-current-saves.json`: ba serialized save `initial`, `combatStart`, `combatAfterAction`; hành trình prepare → garage-market → leave-ha → raid-cache → Minh đánh Kẻ Rình, 5 command tại snapshot cuối. Mỗi save đã `serializeGame` và `loadGame` với definition hiện hành, bao gồm replay so sánh snapshot/log; SHA-256 `2d85401598d53fa83265ac5b27281b8b583b910ba33eab48470ee8dc13912900`.

Đây là fixture R3 hiện hành, không phải bản lưu R1/R2 lịch sử; chưa bao phủ aftermath, thắng/thua hoặc mọi lệnh. Archive data không tự đóng băng code rules và chưa được đăng ký loader; cần test sử dụng archive và rules dispatch trước khi thay semantics. Script tạm tạo snapshot đã xóa sau khi ghi; không sử dụng save cá nhân.

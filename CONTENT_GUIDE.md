# Thêm content LAST CONVOY

Không đưa JavaScript vào content. Các object được validate bằng Zod và allowlist operators trong `src/narrative/schema.ts`. Chạy `npm run validate:content` và `npm run check` sau khi thêm content. Giữ ID cũ ổn định; thay đổi cân bằng/rules làm đổi kết quả replay cần tăng contentVersion.

## Event

Thêm `event(...)` vào bundle trong `src/content/campaign.ts`, hoặc object tương đương schema. Cung cấp ID/version, location IDs, trigger condition, tags, spawn count/priority, title/text keys, choices. Mỗi choice có requirement, 5 resource costs không âm, outcomes trọng số dương, effects và hooks. Thêm mọi text key vào `texts`.

Ví dụ choice dữ liệu: `choice('take-food', [reward('food', 6)])`. Để yêu cầu đã biết quy tắc: `known('hospital.rule')`. Để thay đổi fact và cho người chơi biết: `setFact('story.departed')`. Điều kiện fact không tự cung cấp knowledge. Phải có một choice miễn phí không điều kiện làm fallback.

`resource` effect chỉ thêm tài nguyên; chi phí đưa vào `costs`, engine kiểm tra nguyên tử cùng khẩu phần theo thời gian. Không dùng negative reward để giấu chi phí. `artifact` effect cần chủ cũ/chủ mới hợp lệ, chỉ transfer đúng instance đang thuộc chủ cũ. Hook chỉ tham chiếu event đã có, không bỏ qua eligibility.

## Quest / Story Contract

Thêm template có preconditions, dependencies, objectives/when, success/failure/alternate conditions và effects cho từng resolution. Template sinh quest từ facts hiện tại, không theo event ID tuần tự. Tham chiếu world fact, known fact, actor status, ownership hoặc accessible location. Các nhánh NPC chết, artifact mất chủ hoặc nơi bị phong tỏa cần alternate resolution có thể kiểm thử. Validator kiểm tra schema/refs/cycle/fallback tĩnh; bot và scenario tests kiểm tra khả năng hoàn tất thực tế, không tuyên bố giải được mọi biểu thức logic.

## Skill

Thêm definition vào `src/content/skills.ts`: ID/name/description, target, effect operator (damage/heal/guard/reveal), power, energy/resource cost, cooldown, requirements, optional factId/assetId. Gán ID vào `character.skillIds`. Runtime hiện hỗ trợ đầy đủ bốn operator; skill thông thường chỉ chọn operator có sẵn, không thêm switch theo skill ID. Guard bảo vệ đến lượt kế, heal có thể hồi người downed, reveal cung cấp knowledge có kiểm tra vị trí.

## Artifact

Thêm definition có ID/name/description/initialOwnerId/attackBonus/defenseBonus và optional assetId. Instance khởi tạo riêng, owner nằm trong GameState, không sửa definition khi transfer. Engine không gắn đường dẫn ảnh vào gameplay.

## Region / Location / Route

Thêm region và các location tham chiếu region đó; thêm routes với from/to, bidirectional, travelTicks, fuelCost và chanceBps/minDamage/maxDamage. Địa điểm phải reachable theo hướng cạnh từ start. Có thể dùng `campaign.travelRequirements[locationId]` với condition chung để khóa tuyến theo facts. Thêm event/quest/asset bằng ID, không viết logic riêng cho màn trong world engine.

## Asset

Registry gồm ID/kind/label, optional URI và fallbackId. `src/content/assets.ts` tạo các ID ổn định dạng `asset.<content-id>`, đủ 9 kinds; `src/assets/registry.ts` resolve fallback và phòng cycle. Asset chỉ phục vụ client; engine chạy hoàn toàn khi URI vắng mặt. `AssetArt` xử lý cả URI thiếu và image load error. Thêm URI vào definition để dùng hình riêng; không gắn path vào gameplay. Không phát sound khi chưa có sound asset.

## Kết cục và thoại phản ứng

`src/content/endings.ts` là danh sách ending contracts theo thứ tự ưu tiên: condition, titleKey và textKey. Phải có fallback `always` cuối. Engine chọn từ facts/ownership khi đến goal; UI đọc đúng text của ending đã lưu. Event có `variants` (condition/textKey) để thay thoại theo người được cứu, kỳ vật đổi chủ hoặc NPC chết. Việc thay text không tự thay world facts.

## Kiểm tra trước khi commit

Chạy `npm run check` và các campaign policies liên quan. Khi đổi chi phí/requirements/ownership/fallback, chạy thêm `npm run simulate:campaign -- --seeds 300 --output artifacts/phase5-simulation.json`. Không chỉnh command log hay snapshot trực tiếp để làm test pass. Thêm vùng mới vẫn chỉ cần region/location/routes và content references; renderer map có thể bổ sung tọa độ trình bày, engine không đổi.

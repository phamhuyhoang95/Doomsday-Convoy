import { argonDefinition } from "./argon";
import { validateWorldDefinition } from "../world/registry";
import {
  all,
  always,
  any,
  choice,
  event,
  fact,
  known,
  not,
  reward,
  setFact,
} from "./builders";

const next = structuredClone(argonDefinition);
if (!next.campaign) throw new Error("Journey requires campaign");
next.contentVersion = "0.2.0-campaign.2-journey";
const content = next.campaign;
const facts: Record<string, string> = {
  "journey.radio-scanned": "Bảo đã lọc được tín hiệu người đổi nước ở chợ.",
  "journey.radio-exposed": "Đoàn xe đã phát tín hiệu đáp lại trên tần số mở.",
  "journey.radio-ignored": "Đoàn xe để tiếng radio chìm vào nhiễu.",
  "journey.water-inspected":
    "Lan phát hiện sợi đen trong mẫu nước niêm chì; có thể khử bằng nhiệt.",
  "journey.water-clean": "Đoàn xe đã lọc nước bằng nhiệt thay vì tin niêm chì.",
  "journey.water-raw": "Đoàn xe đã nhận những can nước chưa kiểm định.",
  "journey.water-declined": "Đoàn xe không nhận nước từ người giao hàng.",
  "journey.water-resolved":
    "Đoàn xe đã giải quyết dấu hiệu bất thường từ những can nước.",
  "journey.water-illness":
    "Người trên xe đã chịu hậu quả do giữ lại nước nhiễm bẩn.",
  "journey.contact-settled": "Cuộc trao đổi ở trạm thu phí đã kết thúc.",
};
content.facts.push(
  ...Object.entries(facts).map(([id, description]) => ({ id, description })),
);
const radio = event(
  "journey-radio",
  "location.garage",
  [
    choice(
      "radio-scan",
      [setFact("journey.radio-scanned")],
      { op: "actor", actorId: "character.bao", status: "active" },
      { scrap: 1 },
    ),
    choice("radio-answer", [setFact("journey.radio-exposed")]),
    choice("radio-ignore", [setFact("journey.radio-ignored")]),
  ],
  fact("story.departed"),
  60,
);
const water = event(
  "journey-water",
  "location.market",
  [
    choice(
      "water-verify",
      [setFact("journey.water-inspected")],
      all(
        known("journey.radio-scanned"),
        not(known("journey.water-inspected")),
      ),
    ),
    choice(
      "water-inspect",
      [setFact("journey.water-inspected")],
      all(not(known("journey.water-inspected")), {
        op: "actor",
        actorId: "character.lan",
        status: "active",
      }),
      { medicine: 1 },
    ),
    choice(
      "water-purify",
      [setFact("journey.water-clean"), reward("water", 20)],
      known("journey.water-inspected"),
      { fuel: 2 },
    ),
    choice("water-accept", [setFact("journey.water-raw"), reward("water", 24)]),
    choice("water-decline", [setFact("journey.water-declined")]),
  ],
  all(
    fact("story.survivor-resolved"),
    any(fact("journey.radio-scanned"), fact("journey.radio-exposed")),
    not(
      any(
        fact("journey.water-clean"),
        fact("journey.water-raw"),
        fact("journey.water-declined"),
      ),
    ),
  ),
  30,
);
water.spawn.maxOccurrences = 2;
water.variants = [
  {
    when: known("journey.water-inspected"),
    textKey: "event.journey-water.inspected",
  },
  {
    when: fact("journey.radio-exposed"),
    textKey: "event.journey-water.exposed",
  },
];
const aftermath = event(
  "journey-water-aftermath",
  "location.service",
  [
    choice(
      "water-treat",
      [
        setFact("journey.water-resolved"),
        { op: "restore", target: "crew", amount: 8 },
      ],
      always,
      { medicine: 2 },
    ),
    choice("water-drain", [setFact("journey.water-resolved")], always, {
      water: 8,
    }),
    choice("water-endure", [
      setFact("journey.water-resolved"),
      setFact("journey.water-illness"),
      { op: "damage", target: "crew", amount: 12 },
    ]),
  ],
  all(fact("journey.water-raw"), not(fact("journey.water-resolved"))),
  90,
);
aftermath.locationIds = next.locations
  .filter((l) => l.id !== "location.market" && l.id !== "location.refuge")
  .map((l) => l.id);
const contact = event(
  "journey-contact",
  "location.checkpoint",
  [
    choice(
      "contact-share",
      [
        setFact("journey.contact-settled"),
        setFact("rival.motive"),
        reward("food", 9),
        reward("water", 9),
      ],
      fact("journey.water-clean"),
      { fuel: 2 },
    ),
    choice(
      "contact-sample",
      [setFact("journey.contact-settled"), reward("medicine", 2)],
      known("journey.water-inspected"),
      { water: 2 },
    ),
    choice("contact-leave", [setFact("journey.contact-settled")]),
  ],
  any(fact("journey.water-clean"), fact("journey.water-resolved")),
  70,
);
contact.variants = [
  { when: fact("journey.water-clean"), textKey: "event.journey-contact.clean" },
  {
    when: fact("journey.water-illness"),
    textKey: "event.journey-contact.illness",
  },
];
const events = [radio, water, aftermath, contact];
content.events.push(...events);
// The problem appears at the next stop, on any route; it cannot be evaded by leaving its dialog open.
for (const location of next.locations) {
  const previous = content.travelRequirements[location.id] ?? always;
  content.travelRequirements[location.id] = all(
    previous,
    any(
      { op: "at", locationId: "location.market" },
      not(fact("journey.water-raw")),
      fact("journey.water-resolved"),
    ),
  );
}
const texts: Record<string, string> = {
  "event.journey-radio.title": "Có người vẫn đang phát sóng",
  "event.journey-radio.text":
    "Khi Bảo khép nắp máy, radio bật ra một giọng khàn: ‘Xe số 07, tôi giữ nước cho các anh ở chợ. Đừng mở niêm chì.’ Không ai trên xe nhớ đã báo số xe. Lan đưa tay về nút phát; Bảo giữ cổ tay cô: ‘Nghe trước đã. Đáp lại là họ biết mình còn ở đây.’",
  "choice.radio-scan": "Nhờ Bảo lọc nhiễu, chỉ nghe và ghi lại tín hiệu",
  "outcome.radio-scan":
    "Bảo tháo một cầu chì để lọc nhiễu. Có tiếng dây xích và tiếng máy phát sau giọng nói; địa chỉ giao nước nằm ở dãy sạp phía đông. Anh ghi lại tần số, không phát đáp lại.",
  "choice.radio-answer": "Đáp lại: ai đang giữ nước cho xe chúng tôi?",
  "outcome.radio-answer":
    "Một khoảng im lặng quá dài. Rồi giọng nói đọc đúng tên Minh. ‘Hẹn ở chợ.’ Đèn phát trên radio vẫn sáng thêm một nhịp sau khi Lan buông nút.",
  "choice.radio-ignore": "Tắt kênh. Chúng ta không nợ người lạ một câu trả lời",
  "outcome.radio-ignore":
    "Bảo rút giắc radio. Tiếng gọi tắt giữa một âm tiết. Ngoài cửa kính, phố vẫn im lìm; đoàn xe rời đi mà không biết ai vừa gọi mình.",
  "event.journey-water.title": "Niêm chì còn nguyên",
  "event.journey-water.text":
    "Người giao hàng ở chợ nhận ra tiếng máy xe, đặt hai can nước xuống. Dấu niêm chì còn mới nhưng đáy can lạnh hơn không khí. ‘Các anh đã nghe lời nhắn.’ Lan muốn thử một mẫu; Bảo nhìn bình nhiên liệu: đun lọc sẽ tốn xăng. Nhận hàng thì đủ nước đi xa hơn, nhưng chiếc tem không chứng minh được thứ ở bên trong.",
  "event.journey-water.exposed":
    "Người giao hàng gọi Minh bằng tên trước khi anh bước xuống. Hai can niêm chì đặt sẵn đúng hai bên bánh xe. Người đó biết đoàn có bao nhiêu người. Lan kéo Minh ra xa: ‘Đừng để việc họ biết mình làm ta tưởng mình biết họ.’",
  "event.journey-water.inspected":
    "Lan giữ mẫu thử trước đèn: những sợi đen co lại khi gặp nhiệt rồi nằm yên. ‘Niêm chì giữ thứ này ở trong, không giữ nó ở ngoài.’ Bây giờ đoàn biết cách xử lý; hai can lớn vẫn còn nguyên, bình xăng thì không nhiều hơn lúc trước.",
  "choice.water-verify": "Phát lại bản thu của Bảo, đối chất về nguồn can nước",
  "outcome.water-verify":
    "Tiếng xích trong bản thu khớp với khóa dưới quầy. Người giao hàng ngừng cười: niêm chì vốn để giữ sợi đen bên trong. Bản thu mua cho đoàn câu trả lời mà Lan chưa phải dùng tới bộ thuốc thử.",
  "choice.water-inspect": "Để Lan thử mẫu bằng một bộ thuốc kiểm định",
  "outcome.water-inspect":
    "Mẫu thử để lại vệt sợi đen; đun nóng làm chúng ngừng chuyển động. Lan đánh dấu can. Thông tin đã có, nhưng đoàn vẫn phải quyết định có nhận hàng hay không.",
  "choice.water-purify": "Đun và lọc cả hai can trước khi nhận · tốn 2 xăng",
  "outcome.water-purify":
    "Bảo giữ máy phát chạy tới khi thành can nóng bỏng. Lan lọc từng lượt bằng vải sạch. Hai mươi phần nước vào kho; dưới đáy nồi là một lớp tro đen mỏng. Người giao hàng lặng lẽ ghi dấu lên bản đồ trạm thu phí.",
  "choice.water-accept":
    "Nhận nguyên can, dành xăng cho đường đi · chấp nhận rủi ro chưa xử lý",
  "outcome.water-accept":
    "Hai mươi bốn phần nước được buộc sau ghế. Niêm chì kêu lách cách theo nhịp xe. Lan đánh dấu lô này bằng một sợi chỉ đỏ; chuyện của chúng chưa kết thúc ở chợ.",
  "choice.water-decline": "Trả lại can. Không mang thứ chưa hiểu lên xe",
  "outcome.water-decline":
    "Minh đẩy can về phía người lạ. Không ai cản anh. Khi đoàn quay lưng, những can nước vẫn nằm đúng chỗ cũ như thể chưa từng được đưa ra đổi chác.",
  "event.journey-water-aftermath.title": "Sợi chỉ đỏ sau ghế",
  "event.journey-water-aftermath.text":
    "Rời chợ được một quãng, tiếng gõ xuất hiện trong những can nước dù xe đã dừng. Sợi chỉ đỏ của Lan đen dần từ nút buộc. Nước đã hòa vào phần dự trữ chung; bỏ riêng hai can không còn đủ. Đoàn phải xử lý ngay tại điểm dừng này trước khi máy lại nổ.",
  "choice.water-treat": "Dùng 2 thuốc xử lý nước và chăm sóc cả đội",
  "outcome.water-treat":
    "Lan hòa thuốc xử lý, giữ từng người bên đèn tới khi sắc mặt trở lại. Những can niêm chì bị bỏ lại xa xe. Đoàn mất vật tư nhưng không để tiếng gõ theo mình thêm một chặng.",
  "choice.water-drain": "Xả 8 phần nước chung, súc lại bình và bỏ lô hàng",
  "outcome.water-drain":
    "Bảo mở van. Nước đen chảy xuống mặt đường, rồi nhạt dần. Lan chỉ đóng bình khi tiếng gõ im hẳn. Kho nước vơi đi, nhưng người trên xe chưa phải trả bằng sức khỏe.",
  "choice.water-endure": "Giữ nước, tiếp tục chịu đựng · mỗi người mất 12 HP",
  "outcome.water-endure":
    "Không ai mở van. Cơn rét đi qua từng hàng ghế, để lại đau nhức và những vệt đen dưới móng tay. Tới lúc tiếng gõ im, cả đoàn đã yếu đi. Họ vẫn còn nước để đi tiếp.",
  "event.journey-contact.title": "Người đứng cạnh van nước",
  "event.journey-contact.text":
    "Tại trạm thu phí, một phụ nữ nhận ra sợi chỉ đỏ trên bình dự trữ. ‘Các anh cũng nhận can niêm chì.’ Cô đặt hộp thuốc sau thanh chắn, nhưng không bước gần hơn. Cách đoàn xử lý lô nước đã đi trước họ tới đây.",
  "event.journey-contact.clean":
    "Một phụ nữ bên trạm thu phí nhìn lớp tro còn bám đáy nồi. ‘Có người chịu nghe trước khi uống.’ Cô mở cửa kho nhỏ: còn vài khẩu phần, và bản ghi những chuyến xe Tro Tàn đã đi qua. Cô cần hai can xăng để vận hành máy bơm cho người ở lại.",
  "event.journey-contact.illness":
    "Người phụ nữ nhìn những vệt đen dưới móng tay người trên xe, rồi lùi lại khỏi thanh chắn. ‘Các anh giữ số nước ấy.’ Cô vẫn chỉ lối vòng qua trạm, nhưng cánh cửa kho không mở.",
  "choice.contact-share":
    "Góp 2 xăng cho máy bơm, chia khẩu phần và bản ghi đường đi",
  "outcome.contact-share":
    "Máy bơm sống lại. Người ở trạm chia chín phần ăn, chín phần nước và chỉ dấu Tro Tàn. Nhiên liệu đã thành một mối liên hệ mà đoàn không thể mua bằng cách khác.",
  "choice.contact-sample": "Đưa mẫu thử và chỉ dẫn khử nước để đổi 2 thuốc",
  "outcome.contact-sample":
    "Lan để lại mẫu nước cùng ghi chép nhiệt độ. Hộp thuốc được đẩy qua thanh chắn. Điều đoàn học ở chợ trở thành thứ hữu ích cho những người chưa gặp họ.",
  "choice.contact-leave": "Cảm ơn và giữ nguyên dự trữ của đoàn",
  "outcome.contact-leave":
    "Không có cuộc đổi chác. Người phụ nữ kéo dây cho xe qua. Đoàn mang theo những gì mình còn giữ được, cùng ký ức về những can nước ở chợ.",
};
Object.assign(content.texts, texts);
// Reuse scene backgrounds through presentation mappings without generating duplicate art.
for (const e of events)
  content.assets.push({
    id: `asset.${e.id}`,
    kind: "event",
    label: texts[e.titleKey]!,
    ...(e.locationIds.length === 1
      ? { uri: `/art/a2/location.${e.locationIds[0]!.split(".").at(-1)}.jpg` }
      : {}),
  });
export const journeyDefinition = validateWorldDefinition(next);

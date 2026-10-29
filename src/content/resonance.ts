import { journeyDefinition } from "./journey";
import { occultAbilities, pathwayDefs } from "./pathways";
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
  setFact,
} from "./builders";
import type { Effect } from "../narrative/schema";
const next = structuredClone(journeyDefinition);
if (!next.campaign?.tactics)
  throw new Error("Resonance needs tactical campaign");
next.contentVersion = "0.3.0-campaign.1-resonance";
const c = next.campaign;
const garage = next.locations.find((l) => l.id === "location.garage");
if (garage)
  garage.description =
    "Mùi dầu máy và tro bụi quyện trong góc tối. Bên chiếc xe khách số 07, đoàn kiểm lại vật tư và những người còn ở đây.";
const records = [
  {
    id: "record.awakening",
    factId: "lore.awakening",
    title: "Sổ tay trong hộp cầu chì",
    source: "Gara · chữ viết của một người vận hành Đối Âm",
    confidence: "testimony" as const,
    body: "Tên gọi, nhịp lặp và vật chứng là ba khóa của một điểm neo. Bốn cách giữ khóa đã được ghi lại: khâu mô, nghe nhịp, rèn vật chất, mượn đối xứng. Người viết cảnh báo rằng sức mạnh không chứng minh người dùng đã hiểu quy tắc. Đây là hướng dẫn của một nhân chứng, chưa phải lời giải cho tận thế.",
  },
  {
    id: "record.counter-signal",
    factId: "lore.counter-signal",
    title: "Chuyến xe chưa có điểm đến",
    source: "Cầu vượt · đối chiếu phản quang và bản ghi quãng đường",
    confidence: "observed" as const,
    body: "Bóng xe ngược chiều lặp lại cùng một vết lõm dù đồng hồ hành trình đã đổi. Khi đoàn giữ các cọc phản quang làm mốc, tiếng bánh xe bên kia bị đứt nhịp. Có thể nó đang hoàn tất một chuyến sơ tán chưa từng được ghi nhận tới nơi; phần suy luận ấy vẫn cần vật chứng.",
  },
  {
    id: "record.carrier",
    factId: "lore.carrier",
    title: "Máy phát không truyền giọng nói",
    source: "Trạm dịch vụ · cuộn băng vận hành số 07",
    confidence: "observed" as const,
    body: "Cuộn băng không lưu tiếng người; nó lưu thứ tự phát tên, địa điểm và khoảng ngắt. Một câu trả lời xuất hiện sớm hơn dấu bấm phát. Mạng cứu hộ đã vận chuyển cấu trúc điểm danh ấy qua radio xe và loa bệnh viện. Điều này giải thích vì sao một người lạ có thể biết tên Minh mà chưa gặp anh.",
  },
  {
    id: "record.hospital",
    factId: "lore.hospital-network",
    title: "Bảng bàn giao người chưa về",
    source: "Thánh An · hồ sơ phòng vận hành và nhịp chuông đã đo",
    confidence: "observed" as const,
    body: "Thánh An từng là trạm đối chiếu danh tính người mất tích cho Đề án Đối Âm. Hồi chuông không phải tín hiệu báo tử: nó mở một khoảng nhận câu trả lời. Trả lời trong khoảng đó khiến người sống bị thêm vào danh sách chưa được bàn giao. Cắt một loa ngăn truyền tiếp, không xóa bản ghi đã neo.",
  },
  {
    id: "record.mirror",
    factId: "lore.mirror-witness",
    title: "Ký ức mang ngày mai",
    source: "Khu nội trú · vật chứng trong gương và hồ sơ bệnh nhân",
    confidence: "inferred" as const,
    body: "Bản ghi mang chữ ký Hà có ngày thu sau thời điểm đoàn tìm thấy nó. Vật chứng ở Thánh An phù hợp với giả thuyết về Phía Vọng: một tầng lưu những khả năng chưa khép lại. Gương không tạo ảnh giả tùy ý; nó giữ một đối ứng. Chưa thể kết luận người trong phản chiếu là bản gốc hay người thay thế.",
  },
  {
    id: "record.archive",
    factId: "lore.archive",
    title: "00:07 — Hồi Chuông Số Không",
    source: "Bắc Sơn · bản sao nhật ký đồng bộ tại trạm thu phí",
    confidence: "observed" as const,
    body: "Lúc 00:07, mạng khẩn cấp đồng bộ điểm danh sơ tán với một câu trả lời không phát ra từ trạm nào được ghi nhận. Tên, nơi và nhịp trùng nhau tạo những điểm neo đầu tiên. Bắc Sơn là máy lưu/chuyển tiếp ban đầu, Thánh An là bộ khuếch đại. Chưa có chứng cứ rằng tắt lõi Bắc Sơn sẽ xóa quỷ dị đã tự vận hành. Đến nơi trú chỉ là kết thúc chặng đường, chưa phải kết thúc câu hỏi.",
  },
];
c.facts.push(
  ...records.map((r) => ({
    id: r.factId,
    description: `Đã thu hồ sơ: ${r.title}.`,
  })),
);
c.resonance = {
  pathways: pathwayDefs,
  records,
  chapters: [
    {
      id: "chapter.departure",
      title: "I · Đèn còn sáng",
      question: "Ai đang gọi xe số 07?",
      summary:
        "Giữ đoàn sống sót, tìm vật tư và xác minh tiếng radio trước khi vào Thánh An.",
      locationIds: [
        "location.garage",
        "location.market",
        "location.overpass",
        "location.service",
      ],
      objectives: [
        {
          label: "Chuẩn bị để rời gara",
          kind: "fact",
          referenceId: "story.departed",
        },
        {
          label: "Tìm hiểu sổ tay cộng hưởng",
          kind: "knowledge",
          referenceId: "lore.awakening",
        },
        {
          label: "Tới trạm dịch vụ",
          kind: "visit",
          referenceId: "location.service",
        },
      ],
    },
    {
      id: "chapter.hospital",
      title: "II · Danh sách những người chưa về",
      question: "Vì sao một cái tên có thể trở thành cái bẫy?",
      summary:
        "Học quy tắc chuông, đối chiếu hồ sơ và chọn cách giải quyết Mắt Gương.",
      locationIds: ["location.hospital", "location.ward"],
      objectives: [
        {
          label: "Xác minh quy tắc chuông",
          kind: "knowledge",
          referenceId: "hospital.rule",
        },
        {
          label: "Đọc hồ sơ mạng điểm danh",
          kind: "knowledge",
          referenceId: "lore.hospital-network",
        },
        {
          label: "Giải quyết khu nội trú hoặc đường thay thế",
          kind: "fact",
          referenceId: "hospital.resolved",
        },
      ],
    },
    {
      id: "chapter.refuge",
      title: "III · Bên kia tín hiệu Bắc Sơn",
      question: "Nơi trú đang che chở ai?",
      summary:
        "Đối chất Tro Tàn, xem bản lưu tại checkpoint và đưa đoàn tới Bắc Sơn.",
      locationIds: ["location.checkpoint", "location.refuge"],
      objectives: [
        {
          label: "Giải quyết đối đầu Tro Tàn",
          kind: "fact",
          referenceId: "rival.resolved",
        },
        {
          label: "Thu bản sao nhật ký 00:07",
          kind: "knowledge",
          referenceId: "lore.archive",
        },
        {
          label: "Đưa đoàn tới nơi trú",
          kind: "visit",
          referenceId: "location.refuge",
        },
      ],
    },
  ],
};
for (const ability of occultAbilities) {
  c.tactics!.abilities = c.tactics!.abilities.filter(
    (a) => a.id !== ability.id,
  );
  c.tactics!.abilities.push(ability);
  c.skills = c.skills.filter((s) => s.id !== ability.id);
  c.skills.push({
    id: ability.id,
    name: ability.name,
    description: ability.description,
    target: ability.target === "vehicle" ? "self" : ability.target,
    effect:
      ability.effect === "damage" || ability.effect === "heal"
        ? ability.effect
        : "guard",
    power: ability.power,
    energyCost: ability.energyCost,
    costs: ability.costs,
    cooldownTicks: ability.cooldownTurns,
    requirements: always,
  });
}
// Mundane starting skills remain; supernatural powers require awakening in this bundle.
const occultIds = new Set(occultAbilities.map((a) => a.id));
for (const actor of next.characters)
  if (next.start.characterIds.includes(actor.id) || actor.id === "character.ha")
    actor.skillIds = (actor.skillIds ?? []).filter((id) => !occultIds.has(id));
const basicHeal = c.tactics!.abilities.find((a) => a.id === "skill.heal");
if (basicHeal) {
  basicHeal.name = "Khâu sơ cứu";
  basicHeal.description =
    "Thuốc và băng thường: hồi 22 HP, vực dậy và cầm máu. Tiêu 1 thuốc.";
  const metadata = c.skills.find((s) => s.id === basicHeal.id);
  if (metadata) {
    metadata.name = basicHeal.name;
    metadata.description = basicHeal.description;
  }
}
const grant = (id: string, xp: number, remnants: number): Effect[] => [
  setFact(id),
  { op: "experience", amount: xp },
  { op: "occult-remnants", amount: remnants },
];
const awakening = event(
  "lore-awakening",
  "location.garage",
  [
    choice("study-awakening", grant("lore.awakening", 10, 3)),
    choice("copy-awakening", [
      setFact("lore.awakening"),
      { op: "experience", amount: 10 },
    ]),
  ],
  fact("story.departed"),
  55,
);
const echo = event(
  "lore-counter-signal",
  "location.overpass",
  [
    choice(
      "measure-counter-signal",
      grant("lore.counter-signal", 10, 1),
      always,
      { scrap: 1 },
    ),
    choice("leave-counter-signal", []),
  ],
  fact("road.warning"),
  30,
);
const carrier = event(
  "lore-carrier",
  "location.service",
  [
    choice("read-carrier", grant("lore.carrier", 15, 2)),
    choice("leave-carrier", []),
  ],
  fact("depot.searched"),
  15,
);
const hospital = event(
  "lore-hospital",
  "location.hospital",
  [
    choice("hear-hospital", grant("lore.hospital-network", 25, 2), {
      op: "pathway",
      pathwayId: "path.bell-medium",
      tierAtMost: 9,
    }),
    choice("read-hospital", grant("lore.hospital-network", 25, 2), always, {
      scrap: 1,
    }),
    choice("leave-hospital", []),
  ],
  known("hospital.rule"),
  30,
);
const witness = event(
  "lore-mirror",
  "location.ward",
  [
    choice("trace-mirror", grant("lore.mirror-witness", 20, 2), {
      op: "pathway",
      pathwayId: "path.mirror-walker",
      tierAtMost: 8,
    }),
    choice("read-mirror-witness", grant("lore.mirror-witness", 20, 2), always, {
      medicine: 1,
    }),
    choice("leave-mirror-witness", []),
  ],
  fact("ward.patient-resolved"),
  30,
);
const archive = event(
  "lore-archive",
  "location.checkpoint",
  [
    choice("read-zero-archive", grant("lore.archive", 20, 2)),
    choice("leave-zero-archive", []),
  ],
  fact("hospital.resolved"),
  80,
);
const loreEvents = [awakening, echo, carrier, hospital, witness, archive];
c.events.push(...loreEvents);
const scenes = [
  [
    awakening,
    "Sổ tay trong hộp cầu chì",
    "Bảo tìm thấy một hộp có cùng nhịp gõ với radio. Trong đó là ba mảnh vật chất không phản chiếu cùng một góc và một sổ tay mang dấu Đối Âm. Trang đầu ghi: ‘Đừng uống thứ mình chưa biết cách gọi tên.’ Đoàn có thể học cách giữ một mảnh cộng hưởng trong cơ thể, hoặc chỉ chép lại những gì đã thấy.",
    "Chép sổ, giữ ba di vật để nghiên cứu thức tỉnh",
    "Chỉ chép sổ, niêm phong ba di vật",
  ],
  [
    echo,
    "Chuyến xe không tới nơi",
    "Bóng xe ngược chiều có cùng vết lõm trên cửa ở cả hai lần nhìn. Bảo chỉ cọc phản quang: chúng đã đi được ba cọc nhưng chiếc bóng chưa đi qua một cọc nào. Một miếng kính rơi lại bên lan can, vẫn rung theo nhịp bánh xe không còn ở đó.",
    "Đo lại mốc, ghi bằng chứng và thu mảnh kính",
    "Giữ mắt trên đường, không theo chiếc bóng",
  ],
  [
    carrier,
    "Thứ được truyền qua radio",
    "Máy phát ở trạm không có cuộn ghi giọng nói. Băng chỉ là danh sách tên, nơi và khoảng nghỉ. Vậy giọng khàn gọi xe 07 đến từ đâu? Dưới bàn máy có hai mảnh kim loại đập cùng một nhịp dù không chạm nhau.",
    "Đối chiếu băng, giữ bản sao và hai mảnh cộng hưởng",
    "Không ở lại với chiếc máy này",
  ],
  [
    hospital,
    "Danh sách bàn giao chưa hoàn tất",
    "Sau khi đoàn xác minh nhịp chuông, tủ trực ban mở hé. Hồ sơ Thánh An có những dòng đánh dấu ‘chưa về’ cho cả người đã được ký giấy tử. Muốn đọc đúng phải lần theo mạch loa, hoặc nhờ người đã nghe được nhịp bắt tay dẫn đường.",
    "Nghe nhịp mạng bằng con đường Người Nghe Chuông",
    "Dùng một phế liệu nối mạch, đối chiếu hồ sơ trực ban",
    "Đóng tủ và giữ quy tắc đã biết",
  ],
  [
    witness,
    "Ký ức mang ngày mai",
    "Một chữ ký trùng tên Hà nằm trên bản ghi có ngày thu chưa tới. Gương giữ đoạn hành lang dài hơn căn phòng thật. Lan có thể dùng thuốc thử làm hiện mực; người đi trong gương đủ sâu có thể lần theo đối ứng mà không chạm vào bản gốc.",
    "Lần theo đối ứng bằng con đường Gương bậc 8",
    "Dùng một thuốc làm hiện bản ghi, đối chiếu vật chứng",
    "Không gọi tên người trong gương",
  ],
  [
    archive,
    "00:07 — Hồi Chuông Số Không",
    "Trong buồng thu phí có bản sao niêm phong gửi từ trạm Bắc Sơn. Trang cuối không ghi số người sống; nó ghi thời điểm tất cả trạm cùng nhận một câu trả lời không có người phát. Đoàn đã gần nơi trú hơn bao giờ hết, và cũng gần câu hỏi vì sao mọi chuyện bắt đầu.",
    "Mở bản sao nhật ký đồng bộ, giữ chứng cứ để tới Bắc Sơn",
    "Niêm phong trở lại, ưu tiên đưa đoàn đi qua",
  ],
] as const;
for (const [e, title, body, ...labels] of scenes) {
  c.texts[e.titleKey] = title;
  c.texts[e.textKey] = body;
  e.choices.forEach((ch, i) => {
    c.texts[ch.labelKey] = labels[i] ?? "Tiếp tục";
    for (const out of ch.outcomes)
      c.texts[out.textKey] = out.effects.some((f) => f.op === "experience")
        ? `Đoàn đối chiếu được hồ sơ. ${title} được lưu vào sổ, kinh nghiệm và di vật đã cập nhật. Những dòng chữ chưa trả lời mọi điều, nhưng đây là bằng chứng mang theo được.`
        : "Đoàn đóng lại hồ sơ và giữ nguyên điều chưa biết. Con đường phía trước vẫn còn mở.";
  });
}
// Reading or copying the safety note is required before the first departure; awakening itself is optional.
for (const location of next.locations)
  c.travelRequirements[location.id] = all(
    c.travelRequirements[location.id] ?? always,
    any(
      not({ op: "at", locationId: "location.garage" }),
      known("lore.awakening"),
    ),
  );
export const resonanceDefinition = validateWorldDefinition(next);

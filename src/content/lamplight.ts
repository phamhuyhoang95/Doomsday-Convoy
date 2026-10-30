import { resonanceDefinition } from "./resonance";
import { marketBlackoutScenario } from "./scenarios";
import { validateWorldDefinition } from "../world/registry";
import { emptyResources } from "../core/primitives";
const next = structuredClone(resonanceDefinition);
next.contentVersion = "0.4.0-campaign.1-lamplight";
next.start.resources = {
  food: 84,
  water: 90,
  fuel: 28,
  medicine: 8,
  scrap: 12,
};
const c = next.campaign!;
for (const actor of next.characters) {
  if (actor.id === "character.raven") {
    actor.maxHealth = 64;
    actor.attack = 12;
  }
  if (actor.id === "character.ash") {
    actor.maxHealth = 52;
    actor.attack = 11;
  }
}
c.tactics!.vehicleAttackEvery = 2;
c.tactics!.openingGuard = true;
c.tactics!.vehicleDamageMin = 8;
const market = structuredClone(marketBlackoutScenario);
for (const node of market.nodes)
  for (const a of node.actions) {
    if (a.id === "act.scout-stalls") a.effects = [];
    else if (a.id === "act.loot-stalls")
      a.effects = [
        {
          op: "resources",
          amounts: { ...emptyResources(), food: 3, water: 3 },
        },
      ];
    else if (a.id === "act.start-generator") a.effects = [{ op: "power" }];
    else if (a.id === "act.wire-silently") {
      a.effects = [{ op: "power" }];
      a.costs = { ...emptyResources(), scrap: 1 };
    } else if (a.itemReward)
      a.effects = [{ op: "cargo", itemId: a.itemReward }];
    else if (a.id === "act.rescue-ha")
      a.effects = [{ op: "rescue", quietRole: "mechanic", forcedNoise: 2 }];
  }
c.facts.push(
  { id: "market.scouted", description: "Đã quan sát đường tuần tra ở chợ." },
  {
    id: "field.shadow-rule",
    description:
      "Đã quan sát: tiếng động trong vùng tối gọi bóng lại gần; ánh sáng giữ nó đứng yên.",
  },
  {
    id: "field.thanh-an-resolved",
    description: "Đoàn đã khép lại ca xuất kích ở phòng trực Thánh An.",
  },
  {
    id: "lore.lamplight",
    description: "Đã thu sổ trực ghi các ca mất điện và tiếng bước chân.",
  },
);
c.resonance!.records.push({
  id: "record.lamplight",
  factId: "lore.lamplight",
  title: "Những bước chân không có người",
  source: "Phòng trực Thánh An · sổ giao ca",
  confidence: "observed",
  body: "Ở phòng trực, bóng tối tiến tới khi có tiếng động; ánh sáng giữ nó đứng lại. Sổ giao ca mô tả những tiếng bước chân tiếp tục tìm người sau khi hành lang đã được bàn giao. Đây là quy tắc của điểm neo này, chưa thể suy rộng cho mọi quỷ dị.",
});
c.fieldwork = {
  roles: [
    { actorId: "character.minh", role: "commander" },
    { actorId: "character.lan", role: "medic" },
    { actorId: "character.bao", role: "mechanic" },
    { actorId: "character.ha", role: "radio" },
  ],
  scenarios: [
    {
      ...market,
      durationHours: 2,
      enemyConvoyId: "convoy.scavengers",
      rescuedActorId: "character.ha",
      completionFactId: "cache.secured",
      scoutFactId: "market.scouted",
      cargoRewards: {
        "cargo.fuel": { ...emptyResources(), fuel: 15 },
        "cargo.scrap": { ...emptyResources(), scrap: 10 },
        "cargo.generator": { ...emptyResources(), fuel: 10, scrap: 10 },
      },
    },
  ],
  sites: [
    {
      id: "field.thanh-an",
      name: "Phòng trực Thánh An",
      locationId: "location.hospital",
      requiresKnowledge: ["hospital.rule"],
      brief:
        "Bên trong còn tủ thuốc và sổ giao ca. Chọn một người vào, cả đoàn giữ dây ở cửa. Đèn pin còn ít pin. Tìm đồ, quan sát điều bất thường và tự quyết lúc quay về.",
      grid: [
        "###################",
        "#.....#.....#.....#",
        "#.....#.....#.....#",
        "#.....#.....#.....#",
        "#.................#",
        "#.....#.....#.....#",
        "#.....#.....#.....#",
        "#.....#.....#.....#",
        "###################",
      ],
      start: { x: 2, y: 4 },
      shadowStart: { x: 16, y: 2 },
      lights: [
        { x: 2, y: 4 },
        { x: 8, y: 2 },
        { x: 15, y: 6 },
      ],
      rooms: [
        { name: "Sảnh bàn giao", x: 1, y: 1, width: 5, height: 7 },
        { name: "Phòng trực", x: 7, y: 1, width: 5, height: 7 },
        { name: "Kho hồ sơ", x: 13, y: 1, width: 5, height: 7 },
      ],
      objects: [
        {
          id: "field.exit",
          kind: "exit",
          position: { x: 1, y: 4 },
          name: "Dây dẫn về xe",
          description: "Mang những gì đang giữ về đoàn.",
          noise: 0,
        },
        {
          id: "field.door-west",
          kind: "door",
          position: { x: 6, y: 4 },
          name: "cửa phòng trực",
          description: "Cánh cửa chắn lối đi và tiếng kéo lê.",
          noise: 2,
        },
        {
          id: "field.door-east",
          kind: "door",
          position: { x: 12, y: 4 },
          name: "cửa kho hồ sơ",
          description: "Then cửa lạnh ngắt.",
          noise: 2,
        },
        {
          id: "field.medicine",
          kind: "cache",
          position: { x: 10, y: 6 },
          name: "Tủ thuốc niêm phong",
          description:
            "Bạn giữ lại ba lọ thuốc còn nguyên nhãn. Tiếng kim loại rơi nghe rõ từ căn phòng bên.",
          noise: 3,
          reward: {
            resources: { ...emptyResources(), medicine: 3 },
            xp: 4,
            remnants: 0,
          },
        },
        {
          id: "field.logbook",
          kind: "record",
          position: { x: 16, y: 6 },
          name: "Sổ giao ca 00:07",
          description:
            "Gáy sổ có những nét chì ghi thời điểm đèn tắt và tiếng chân. Mang về xe để đối chiếu.",
          noise: 2,
          reward: {
            resources: emptyResources(),
            xp: 8,
            remnants: 1,
            factId: "lore.lamplight",
          },
        },
        {
          id: "field.toolcase",
          kind: "cache",
          position: { x: 16, y: 1 },
          name: "Hộp bảo trì máy phát",
          description:
            "Hai linh kiện và một can xăng nhỏ. Túi chỉ giữ được hai món; bạn phải chọn thứ mang về.",
          noise: 3,
          reward: {
            resources: { ...emptyResources(), fuel: 3, scrap: 2 },
            xp: 4,
            remnants: 0,
          },
        },
      ],
      reserveHours: 2,
      maxBeats: 96,
      battery: 24,
      capacity: 2,
      shadowDamage: 12,
      rescueDamage: 4,
      rescueVehicleCost: 8,
      ruleFactId: "field.shadow-rule",
      completedFactId: "field.thanh-an-resolved",
    },
  ],
};
export const lamplightDefinition = validateWorldDefinition(next);

import type { z } from "zod";
import { emptyResources } from "../core/primitives";
import type { operationsDefinitionSchema } from "../expedition/schema";

export const operations: z.infer<typeof operationsDefinitionSchema> = {
  rest: { healthPerTick: 5, energyPerTick: 2 },
  repair: { scrapCost: 2, condition: 18 },
  progression: { xpPerPoint: 10, startingPoints: 1, scoutXp: 3, rivalXp: 10 },
  upgrades: [
    {
      id: "training.power",
      name: "Cường công",
      attribute: "attack",
      amount: 2,
    },
    {
      id: "training.endurance",
      name: "Thể lực",
      attribute: "maxHealth",
      amount: 12,
    },
    {
      id: "training.focus",
      name: "Tập trung",
      attribute: "maxEnergy",
      amount: 2,
    },
  ],
  stances: [
    {
      id: "stance.balanced",
      name: "Cân bằng",
      description: "Giữ nguyên công và thủ.",
      attack: 0,
      defense: 0,
    },
    {
      id: "stance.assault",
      name: "Xung kích",
      description: "+3 công, −2 thủ. Kết thúc trận nhanh nhưng dễ bị thương.",
      attack: 3,
      defense: -2,
    },
    {
      id: "stance.guard",
      name: "Yểm hộ",
      description: "−2 công, +4 thủ. Chống đỡ tốt hơn để hỗ trợ đồng đội.",
      attack: -2,
      defense: 4,
    },
  ],
  recon: [
    {
      locationId: "location.garage",
      description: "Đọc dấu bánh xe, tìm can dự trữ trong gara.",
      factIds: ["road.warning"],
      rewards: { ...emptyResources(), fuel: 2, scrap: 2 },
    },
    {
      locationId: "location.market",
      description:
        "Tìm lối vòng qua các sạp đổ và một thùng khẩu phần bị che khuất.",
      factIds: ["road.warning"],
      rewards: { ...emptyResources(), food: 8, water: 8 },
    },
    {
      locationId: "location.overpass",
      description: "Đánh dấu phần cầu còn chịu tải, lấy vật liệu từ xe bỏ lại.",
      factIds: ["road.warning"],
      rewards: { ...emptyResources(), scrap: 4, fuel: 1 },
    },
    {
      locationId: "location.service",
      description: "Kiểm tra máy bơm và nghe radio của người gác trạm.",
      factIds: ["rival.motive"],
      rewards: { ...emptyResources(), fuel: 3, water: 5 },
    },
    {
      locationId: "location.hospital",
      description: "Dò hành lang bằng dấu mực và tìm tủ thuốc chưa mở.",
      factIds: ["road.warning"],
      rewards: { ...emptyResources(), medicine: 2 },
    },
    {
      locationId: "location.ward",
      description:
        "Quan sát bóng trong gương, đánh dấu lối thoát không có tiếng chuông.",
      factIds: ["rival.motive"],
      rewards: { ...emptyResources(), medicine: 1, water: 5 },
    },
    {
      locationId: "location.checkpoint",
      description: "Theo dõi xe Tro Tàn và kiểm tra rào chắn trước chặng cuối.",
      factIds: ["rival.motive"],
      rewards: { ...emptyResources(), fuel: 2, scrap: 3 },
    },
    {
      locationId: "location.refuge",
      description: "Xác minh tín hiệu cứu hộ.",
      factIds: ["journey.refuge-reached"],
      rewards: emptyResources(),
    },
  ].map((entry) => ({ ...entry, duration: 5, riskReductionBps: 5000 })),
};

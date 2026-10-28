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
      description: "Giữ nhịp thở ổn định, công thủ toàn diện.",
      attack: 0,
      defense: 0,
    },
    {
      id: "stance.assault",
      name: "Xung kích",
      description: "+3 công, −2 thủ. Đạp chân xông lên dồn dập, đổi an toàn lấy sát thương kết liễu.",
      attack: 3,
      defense: -2,
    },
    {
      id: "stance.guard",
      name: "Yểm hộ",
      description: "−2 công, +4 thủ. Dựng khiên bọc lót, chấp nhận làm bia đỡ đạn che chắn cho đồng đội.",
      attack: -2,
      defense: 4,
    },
  ],
  recon: [
    {
      locationId: "location.garage",
      description: "Lùng sục các hốc tối gara, chắt từng can dầu cặn và nhặt bu-lông còn dùng được.",
      factIds: ["road.warning"],
      rewards: { ...emptyResources(), fuel: 2, scrap: 2 },
    },
    {
      locationId: "location.market",
      description:
        "Lách qua các sạp hàng đổ nát, moi thùng lương khô bị chôn vùi dưới đống đổ nát.",
      factIds: ["road.warning"],
      rewards: { ...emptyResources(), food: 8, water: 8 },
    },
    {
      locationId: "location.overpass",
      description: "Đo đạc nhịp cầu còn chịu tải, cạy giáp thép từ xác xe buýt cháy đen.",
      factIds: ["road.warning"],
      rewards: { ...emptyResources(), scrap: 4, fuel: 1 },
    },
    {
      locationId: "location.service",
      description: "Soi đèn xuống bồn xăng ngầm và nghe lén tần số radio của gã gác trạm.",
      factIds: ["rival.motive"],
      rewards: { ...emptyResources(), fuel: 3, water: 5 },
    },
    {
      locationId: "location.hospital",
      description: "Lần theo vết máu khô ở sảnh đón tiếp, cạy tủ thuốc cấp cứu chưa bị cướp phá.",
      factIds: ["road.warning"],
      rewards: { ...emptyResources(), medicine: 2 },
    },
    {
      locationId: "location.ward",
      description:
        "Dán mắt vào bóng tối qua khe cửa, ghi nhớ đường rút lui khi tiếng chuông đồng cất lên.",
      factIds: ["rival.motive"],
      rewards: { ...emptyResources(), medicine: 1, water: 5 },
    },
    {
      locationId: "location.checkpoint",
      description: "Trườn qua bãi cỏ cháy quan sát đội hình xe tải Tro Tàn và vị trí họng súng ngắm.",
      factIds: ["rival.motive"],
      rewards: { ...emptyResources(), fuel: 2, scrap: 3 },
    },
    {
      locationId: "location.refuge",
      description: "Dò dải băng tần khẩn cấp xác nhận cửa hầm Bắc Sơn vẫn đang mở đón người sống sót.",
      factIds: ["journey.refuge-reached"],
      rewards: emptyResources(),
    },
  ].map((entry) => ({ ...entry, duration: 5, riskReductionBps: 5000 })),
};

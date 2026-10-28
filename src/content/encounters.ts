import type { CampaignContent } from "../narrative/schema";

export const marketEncounter: NonNullable<
  CampaignContent["encounters"]
>[number] = {
  id: "encounter.market",
  name: "Ổ phục kích ở kho hàng",
  convoyId: "convoy.scavengers",
  characterIds: ["character.hunger", "character.watcher"],
  locationId: "location.market",
  resources: { food: 9, water: 8, fuel: 2, medicine: 1, scrap: 3 },
  vehicle: {
    id: "vehicle.wreck",
    name: "Xe bán tải bỏ hoang",
    maxCondition: 60,
  },
  victoryFactId: "cache.secured",
  capturedFactId: "cache.captives",
  deadFactId: "cache.dead",
  escapeFactId: "cache.escaped",
  rewardXp: 10,
};

import { worldDefinition } from "./world";
import { validateWorldDefinition } from "../world/registry";
import { campaignEvents } from "./events";
import { campaignQuests } from "./quests";
import { campaignFacts } from "./facts";
import { campaignTexts } from "./texts";
import { campaignEndings } from "./endings";
import { contentAssets } from "./assets";
import { skills } from "./skills";
import { rival } from "./rival";

const characters = [
  ...worldDefinition.characters.map((character) => ({
    ...character,
    attack: character.id === "character.minh" ? 14 : 11,
    defense: 3,
    maxEnergy: 6,
    skillIds:
      character.id === "character.lan"
        ? ["skill.heal", "skill.sense"]
        : ["skill.strike", "skill.guard"],
  })),
  {
    id: "character.ha",
    name: "Hà",
    role: "Kỹ thuật vô tuyến",
    maxHealth: 64,
    attack: 8,
    defense: 2,
    maxEnergy: 5,
    skillIds: ["skill.guard"],
  },
  {
    id: "character.raven",
    name: "Quạ",
    role: "Thủ lĩnh Tro Tàn",
    maxHealth: 36,
    attack: 9,
    defense: 2,
    maxEnergy: 4,
    skillIds: [],
  },
  {
    id: "character.ash",
    name: "Tàn",
    role: "Hộ vệ",
    maxHealth: 30,
    attack: 8,
    defense: 1,
    maxEnergy: 4,
    skillIds: [],
  },
];
const artifacts = [
  {
    id: "artifact.mirror",
    name: "Mắt gương",
    description: "Nhìn thấy thứ đang nhìn lại. +3 tấn công cho đoàn sở hữu.",
    initialOwnerId: "location.ward",
    attackBonus: 3,
    defenseBonus: 0,
    assetId: "asset.artifact.mirror",
  },
  {
    id: "artifact.lantern",
    name: "Đèn không tắt",
    description:
      "Giữ yên tiếng gọi. +2 phòng thủ và mở nhánh vượt bệnh viện bị niêm phong.",
    initialOwnerId: "location.service",
    attackBonus: 0,
    defenseBonus: 2,
    assetId: "asset.artifact.lantern",
  },
];
const assets = contentAssets([
  {
    kind: "location",
    entries: worldDefinition.locations.map((entry) => ({
      id: entry.id,
      label: entry.name,
    })),
  },
  {
    kind: "event",
    entries: campaignEvents.map((entry) => ({
      id: entry.id,
      label: campaignTexts[entry.titleKey] ?? entry.id,
    })),
  },
  {
    kind: "portrait",
    entries: characters.map((entry) => ({ id: entry.id, label: entry.name })),
  },
  {
    kind: "skill",
    entries: skills.map((entry) => ({ id: entry.id, label: entry.name })),
  },
  {
    kind: "artifact",
    entries: artifacts.map((entry) => ({ id: entry.id, label: entry.name })),
  },
  {
    kind: "vehicle",
    entries: [
      { id: "vehicle.bus", label: "Xe khách số 07" },
      { id: "vehicle.rival", label: "Xe tải Tro Tàn" },
    ],
  },
  {
    kind: "anomaly",
    entries: [{ id: "anomaly.bell", label: "Người gọi tên" }],
  },
  {
    kind: "sound",
    entries: [{ id: "sound.radio", label: "Radio — chưa có audio asset" }],
  },
  { kind: "fx", entries: [{ id: "fx.hazard", label: "Chướng ngại" }] },
]);

export const campaignDefinition = validateWorldDefinition({
  ...structuredClone(worldDefinition),
  contentVersion: "0.1.0-campaign.4",
  characters,
  start: {
    ...structuredClone(worldDefinition.start),
    resources: { food: 96, water: 108, fuel: 34, medicine: 8, scrap: 12 },
  },
  campaign: {
    id: "campaign.last-convoy",
    texts: campaignTexts,
    facts: campaignFacts,
    events: campaignEvents,
    quests: campaignQuests,
    endings: campaignEndings,
    travelRequirements: {
      "location.checkpoint": {
        op: "fact",
        id: "hospital.resolved",
        value: true,
      },
      "location.refuge": { op: "fact", id: "rival.resolved", value: true },
    },
    artifacts,
    skills: skills.map((skill) => ({ ...skill, assetId: `asset.${skill.id}` })),
    assets,
    rival: {
      ...rival,
      negotiationCondition: {
        op: "any",
        conditions: [
          { op: "known", id: "rival.motive" },
          { op: "fact", id: "story.rescued", value: true },
        ],
      },
    },
    anomalies: [
      {
        id: "anomaly.bell",
        name: "Người gọi tên",
        ruleFactId: "hospital.rule",
        violationEffects: [{ op: "damage", target: "crew", amount: 12 }],
      },
    ],
  },
});

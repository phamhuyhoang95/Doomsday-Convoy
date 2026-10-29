import { campaignDefinition } from "./campaign";
import { validateWorldDefinition } from "../world/registry";
import { emptyResources } from "../core/primitives";
import type { TacticalAbility } from "../combat/tactical-schema";

const ability = (
  data: Partial<TacticalAbility> &
    Pick<TacticalAbility, "id" | "name" | "description" | "effect">,
): TacticalAbility => ({
  source: "actor",
  target: "enemy",
  reach: "any",
  power: 0,
  energyCost: 1,
  costs: emptyResources(),
  cooldownTurns: 1,
  ...data,
});
export const argonAbilities: TacticalAbility[] = [
  ability({
    id: "skill.strike",
    name: "Phá giáp",
    description:
      "Đập vỡ giáp tuyến đầu. Giảm 4 phòng thủ trong 2 lượt của mục tiêu.",
    effect: "damage",
    reach: "front",
    power: 5,
    energyCost: 2,
    appliesStatus: { kind: "armor-broken", turns: 2, potency: 4 },
  }),
  ability({
    id: "skill.glass-sever",
    name: "Lưỡi kính",
    description:
      "Đòn xuyên hàng. Sát thương tăng 60% lên mục tiêu bị phá giáp.",
    effect: "damage",
    power: 8,
    energyCost: 3,
    exploitStatus: "armor-broken",
    bonusBps: 6000,
  }),
  ability({
    id: "skill.heal",
    name: "Chỉ khâu đỏ",
    description: "Hồi 22 HP, vực dậy đồng đội và cầm máu. Tiêu 1 thuốc.",
    target: "ally",
    effect: "heal",
    power: 22,
    costs: { ...emptyResources(), medicine: 1 },
  }),
  ability({
    id: "skill.guard",
    name: "Giáp hộ tống",
    description:
      "Che chắn một đồng đội, giảm 50% sát thương tới lượt kế của họ.",
    target: "ally",
    effect: "guard",
    appliesStatus: { kind: "guard", turns: 1, potency: 50 },
  }),
  ability({
    id: "skill.rust-shrapnel",
    name: "Đạn gỉ sét",
    description:
      "Bắn mảnh sắt xuyên hàng; gây chảy máu 4 HP trong 2 lượt. Tiêu 1 phế liệu.",
    effect: "damage",
    power: 4,
    energyCost: 2,
    costs: { ...emptyResources(), scrap: 1 },
    appliesStatus: { kind: "bleed", turns: 2, potency: 4 },
  }),
  ability({
    id: "skill.field-repair",
    name: "Vá giáp xe",
    description:
      "Khôi phục 15 độ bền xe bằng 2 phế liệu. Một hỗ trợ xe mỗi vòng, tiêu lượt người ra lệnh.",
    source: "vehicle",
    target: "vehicle",
    effect: "repair",
    power: 15,
    energyCost: 0,
    costs: { ...emptyResources(), scrap: 2 },
    cooldownTurns: 0,
  }),
  ability({
    id: "skill.headlight",
    name: "Đèn pha áp chế",
    description:
      "Tia sáng xuyên hàng gây sát thương và phá giáp. Tiêu 1 xăng; một hỗ trợ xe mỗi vòng.",
    source: "vehicle",
    effect: "damage",
    power: 4,
    energyCost: 0,
    costs: { ...emptyResources(), fuel: 1 },
    cooldownTurns: 0,
    appliesStatus: { kind: "armor-broken", turns: 2, potency: 3 },
  }),
  ability({
    id: "skill.mirror-ward",
    name: "Gương phản mệnh",
    description:
      "Phản lại đòn kế tiếp tới lượt sau. Yêu cầu sở hữu Mắt gương; hồi 3 lượt.",
    source: "artifact",
    artifactId: "artifact.mirror",
    target: "self",
    effect: "reflect",
    energyCost: 2,
    cooldownTurns: 3,
    appliesStatus: { kind: "reflect", turns: 1, potency: 100 },
  }),
];

const next = structuredClone(campaignDefinition);
if (!next.campaign) throw new Error("Argon requires campaign content");
next.contentVersion = "0.2.0-campaign.1-argon";
next.campaign.tactics = { encounterTicks: 1, abilities: argonAbilities };
// New rules live in a new bundle. R1/R4 content and its resolver stay intact.
for (const entry of argonAbilities) {
  if (!next.campaign.skills.some((s) => s.id === entry.id))
    next.campaign.skills.push({
      id: entry.id,
      name: entry.name,
      description: entry.description,
      target: entry.target === "vehicle" ? "self" : entry.target,
      effect:
        entry.effect === "repair" ||
        entry.effect === "reflect" ||
        entry.effect === "shift" ||
        entry.effect === "fortress"
          ? "guard"
          : entry.effect,
      power: entry.power,
      energyCost: entry.energyCost,
      costs: entry.costs,
      cooldownTicks: entry.cooldownTurns,
      requirements: { op: "always" },
    });
}
for (const actor of next.characters) {
  if (actor.id === "character.minh")
    actor.skillIds = ["skill.strike", "skill.glass-sever"];
  if (actor.id === "character.bao")
    actor.skillIds = ["skill.rust-shrapnel", "skill.guard"];
  if (actor.id === "character.lan")
    actor.skillIds = ["skill.heal", "skill.guard", "skill.sense"];
}
export const argonDefinition = validateWorldDefinition(next);

import { damageRange } from "../combat/actions";
import { currentCombatActor } from "../combat/engine";
import { canAfford, supplyCosts } from "../core/resources";
import type { GameState } from "../core/state-schema";
import { evaluateCondition } from "../narrative/conditions";
import type { WorldDefinition } from "../world/schema";

export function skillView(
  state: GameState,
  actorId: string,
  skillId: string,
  targetId: string | undefined,
  definition: WorldDefinition,
) {
  const actor = state.actors[actorId];
  const skill = definition.campaign?.skills.find(
    (entry) => entry.id === skillId,
  );
  const target = targetId ? state.actors[targetId] : actor;
  const convoy = state.convoys[state.player.convoyId];
  if (!actor || !skill || !convoy)
    return {
      enabled: false,
      reason: "Không tìm thấy kỹ năng.",
      impact: "",
      cooldown: 0,
    };
  const cooldown = Math.max(
    0,
    (actor.cooldowns?.[skillId] ?? 0) - state.world.tick - 1,
  );
  let reason =
    state.status !== "active"
      ? "Hành trình đã kết thúc."
      : actor.status !== "active"
        ? "Nhân vật không thể hành động."
        : !actor.skillIds?.includes(skillId) || actor.convoyId !== convoy.id
          ? "Nhân vật không biết kỹ năng."
          : "";
  if (
    state.combat &&
    (currentCombatActor(state)?.id !== actorId ||
      state.combat.phase !== "active")
  )
    reason ||= "Chưa đến lượt nhân vật.";
  if (
    state.combat
      ? skill.target === "exploration"
      : skill.target !== "exploration" &&
        !(definition.campaign?.operations && skill.effect === "heal")
  )
    reason ||= "Dùng trong trận chiến.";
  if (!evaluateCondition(state, skill.requirements))
    reason ||= "Cần ở đúng địa điểm để sử dụng.";
  if ((actor.energy ?? 0) < skill.energyCost) reason ||= "Thiếu năng lượng.";
  if (cooldown > 0) reason ||= `Còn ${cooldown} giờ hồi chiêu.`;
  const supplies = supplyCosts(state, convoy, 1, definition);
  const costs = {
    ...skill.costs,
    food: skill.costs.food + supplies.food,
    water: skill.costs.water + supplies.water,
  };
  if (!canAfford(convoy.resources, costs))
    reason ||= "Thiếu vật tư (bao gồm khẩu phần).";
  if (
    skill.target === "enemy" &&
    (!target ||
      target.status !== "active" ||
      target.convoyId === convoy.id ||
      (state.combat && target.convoyId !== state.combat.enemyConvoyId))
  )
    reason ||= "Chọn một đối thủ đang đứng.";
  if (
    (skill.target === "ally" || skill.target === "self") &&
    (!target ||
      target.convoyId !== convoy.id ||
      target.status === "dead" ||
      target.status === "captured")
  )
    reason ||= "Chọn đồng đội còn sống.";
  if (skill.target === "self" && target?.id !== actor.id)
    reason ||= "Kỹ năng tác dụng lên bản thân.";
  if (
    definition.campaign?.operations &&
    skill.effect === "heal" &&
    target &&
    target.health === target.maxHealth
  )
    reason ||= "Mục tiêu đã đầy HP.";
  const damage = target
    ? damageRange(state, actor.id, target.id, skill.power, definition)
    : [0, 0];
  const recon = definition.campaign?.operations?.recon.find(
    (entry) => entry.locationId === convoy.locationId,
  );
  const impact =
    skill.effect === "damage"
      ? `${damage[0]}–${damage[1]} sát thương`
      : skill.effect === "heal"
        ? `Hồi ${target ? Math.min(skill.power, target.maxHealth - target.health) : skill.power} HP${target?.status === "downed" ? " · vực dậy" : ""}`
        : skill.effect === "guard"
          ? `Giảm 50% sát thương đến lượt sau · hồi tối đa ${skill.power} HP`
          : recon
            ? `Khám phá quy tắc · giảm ${Math.min(9000, recon.riskReductionBps + 2000) / 100}% rủi ro trong ${recon.duration} giờ`
            : "Khám phá manh mối / quy tắc mới";
  return { enabled: !reason, reason, impact, cooldown, costs };
}

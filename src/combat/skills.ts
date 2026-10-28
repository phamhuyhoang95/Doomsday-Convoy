import { CommandError } from "../core/commands";
import { establishFact } from "../core/facts";
import { canAfford, subtractResources } from "../core/resources";
import type { GameState } from "../core/state-schema";
import { evaluateCondition } from "../narrative/conditions";
import type { Emit } from "../narrative/effects";
import type { WorldDefinition } from "../world/schema";
import { dealDamage } from "./actions";
import { scoutLocation } from "../expedition/operations";

export function useSkill(
  state: GameState,
  actorId: string,
  skillId: string,
  targetId: string | undefined,
  definition: WorldDefinition,
  emit: Emit,
): void {
  const actor = state.actors[actorId];
  const skill = definition.campaign?.skills.find(
    (entry) => entry.id === skillId,
  );
  const convoy = actor ? state.convoys[actor.convoyId] : undefined;
  if (
    !actor ||
    actor.convoyId !== state.player.convoyId ||
    actor.status !== "active" ||
    !actor.skillIds?.includes(skillId) ||
    !skill ||
    !convoy
  )
    throw new CommandError("SKILL_UNAVAILABLE", "Actor cannot use this skill.");
  if (
    state.combat
      ? skill.target === "exploration"
      : skill.target !== "exploration" &&
        !(definition.campaign?.operations && skill.effect === "heal")
  )
    throw new CommandError(
      "SKILL_UNAVAILABLE",
      "Skill is unavailable in this context.",
    );
  if (!evaluateCondition(state, skill.requirements))
    throw new CommandError(
      "REQUIREMENTS_NOT_MET",
      "Skill requirements are not met.",
    );
  if (
    (actor.energy ?? 0) < skill.energyCost ||
    (actor.cooldowns?.[skillId] ?? 0) > state.world.tick
  )
    throw new CommandError(
      "SKILL_UNAVAILABLE",
      "Not enough energy or skill is cooling down.",
    );
  if (!canAfford(convoy.resources, skill.costs))
    throw new CommandError("INSUFFICIENT_RESOURCES", "Cannot pay skill cost.");
  const target = targetId ? state.actors[targetId] : actor;
  if (
    skill.target === "enemy" &&
    (!target ||
      target.convoyId === actor.convoyId ||
      target.status !== "active")
  )
    throw new CommandError("INVALID_TARGET", "Select an active enemy.");
  if (
    (skill.target === "ally" || skill.target === "self") &&
    (!target ||
      target.convoyId !== actor.convoyId ||
      target.status === "dead" ||
      target.status === "captured")
  )
    throw new CommandError("INVALID_TARGET", "Select a living ally.");
  if (skill.target === "self" && target?.id !== actor.id)
    throw new CommandError("INVALID_TARGET", "Skill targets its caster.");
  if (
    definition.campaign?.operations &&
    skill.effect === "heal" &&
    target &&
    target.health === target.maxHealth
  )
    throw new CommandError("REQUIREMENTS_NOT_MET", "Mục tiêu đã đầy HP.");
  convoy.resources = subtractResources(convoy.resources, skill.costs);
  actor.energy = (actor.energy ?? 0) - skill.energyCost;
  actor.cooldowns ??= {};
  actor.cooldowns[skillId] = state.world.tick + skill.cooldownTicks;
  switch (skill.effect) {
    case "damage":
      if (!target) throw new CommandError("INVALID_TARGET", "Missing target");
      dealDamage(
        state,
        actor.id,
        target.id,
        skill.power,
        definition,
        emit,
        "skill",
      );
      if (state.combat) {
        state.combat.vulnerableActorIds ??= [];
        if (!state.combat.vulnerableActorIds.includes(target.id)) {
          state.combat.vulnerableActorIds.push(target.id);
          state.combat.log.push(
            `${target.name} bị LỘ ĐIỂM YẾU (Nhận thêm 40% sát thương)!`,
          );
        }
      }
      break;
    case "heal":
      if (!target) throw new CommandError("INVALID_TARGET", "Missing ally");
      const healed = Math.min(skill.power, target.maxHealth - target.health);
      target.health = Math.min(target.maxHealth, target.health + skill.power);
      if (target.health > 0 && target.status === "downed")
        target.status = "active";
      if (state.combat) {
        state.combat.panickedActorIds =
          state.combat.panickedActorIds?.filter((id) => id !== target.id) ?? [];
        state.combat.bleedingActorIds =
          state.combat.bleedingActorIds?.filter((id) => id !== target.id) ?? [];
      }
      emit({
        type: "combat.action",
        actorId: actor.id,
        action: "heal",
        targetId: target.id,
        amount: definition.campaign?.operations ? healed : skill.power,
      });
      break;
    case "guard":
      if (state.combat && !state.combat.defendedActorIds.includes(actor.id))
        state.combat.defendedActorIds.push(actor.id);
      actor.health = Math.min(actor.maxHealth, actor.health + skill.power);
      break;
    case "reveal":
      if (skill.factId) establishFact(state, skill.factId, true);
      if (definition.campaign?.operations)
        scoutLocation(state, definition, emit, 2000);
      break;
  }
  emit({
    type: "resources.consumed",
    convoyId: convoy.id,
    costs: skill.costs,
    reason: "skill",
  });
  emit({ type: "skill.used", actorId, skillId });
}

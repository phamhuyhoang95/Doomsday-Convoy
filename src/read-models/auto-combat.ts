import type { GameState } from "../core/state-schema";
import type { GameCommand } from "../core/commands";
import type { WorldDefinition } from "../world/schema";
import { currentCombatActor } from "../combat/engine";
import {
  abilityReason,
  attackReason,
  tacticalDamageRange,
} from "../combat/tactical-engine";

/** A deterministic suggestion, never a mutation. No surrender/capture/finish decisions. */
export function autoCombatAction(
  state: GameState,
  definition: WorldDefinition,
): GameCommand["payload"] | null {
  const battle = state.combat;
  const actor = currentCombatActor(state);
  if (
    state.status !== "active" ||
    battle?.phase !== "active" ||
    !battle.tactics ||
    !actor ||
    actor.status !== "active" ||
    actor.convoyId !== state.player.convoyId
  )
    return null;
  const convoy = state.convoys[actor.convoyId]!;
  const abilities = definition.campaign?.tactics?.abilities ?? [];
  const allies = battle.turnOrder
    .flatMap((id) =>
      state.actors[id]?.convoyId === actor.convoyId ? [state.actors[id]!] : [],
    )
    .filter((a) => a.status === "active" || a.status === "downed")
    .sort(
      (a, b) =>
        a.health / a.maxHealth - b.health / b.maxHealth ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
  const base = {
    type: "battle-action" as const,
    convoyId: convoy.id,
    actorId: actor.id,
  };
  for (const ally of allies)
    if (ally.health < ally.maxHealth * 0.45) {
      const heal = abilities.find(
        (a) =>
          a.effect === "heal" && !abilityReason(state, actor.id, a, ally.id),
      );
      if (heal)
        return {
          ...base,
          action: "ability",
          abilityId: heal.id,
          targetId: ally.id,
        };
    }
  if (convoy.vehicle.condition < convoy.vehicle.maxCondition * 0.35) {
    const repair = abilities.find(
      (a) =>
        a.effect === "repair" && !abilityReason(state, actor.id, a, undefined),
    );
    if (repair) return { ...base, action: "ability", abilityId: repair.id };
  }
  const options: {
    payload: GameCommand["payload"];
    score: number;
    order: number;
  }[] = [];
  for (const id of battle.turnOrder) {
    const target = state.actors[id];
    if (
      !target ||
      target.convoyId === actor.convoyId ||
      target.status !== "active"
    )
      continue;
    if (!attackReason(state, actor.id, id)) {
      const [low, high] = tacticalDamageRange(state, actor.id, id, definition);
      options.push({
        payload: { ...base, action: "attack", targetId: id },
        score: (low + high) / 2 + (low >= target.health ? 1000 : 0),
        order: options.length,
      });
    }
    for (const ability of abilities) {
      // Keep fuel and artifacts for explicit player decisions; leave a small scrap reserve.
      if (
        ability.source !== "actor" ||
        ability.effect !== "damage" ||
        convoy.resources.scrap - ability.costs.scrap < 2 ||
        abilityReason(state, actor.id, ability, id)
      )
        continue;
      const [low, high] = tacticalDamageRange(
        state,
        actor.id,
        id,
        definition,
        ability,
      );
      const combo =
        ability.exploitStatus &&
        battle.tactics.statuses.some(
          (s) => s.actorId === id && s.kind === ability.exploitStatus,
        );
      options.push({
        payload: {
          ...base,
          action: "ability",
          abilityId: ability.id,
          targetId: id,
        },
        score:
          (low + high) / 2 -
          ability.energyCost +
          (low >= target.health ? 1000 : 0) +
          (combo ? 8 : 0),
        order: options.length,
      });
    }
  }
  return (
    options.sort((a, b) => b.score - a.score || a.order - b.order)[0]
      ?.payload ?? { ...base, action: "guard" }
  );
}

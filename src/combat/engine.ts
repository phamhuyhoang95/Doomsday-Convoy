import { CommandError } from "../core/commands";
import type { GameCommand } from "../core/commands";
import { establishFact } from "../core/facts";
import { nextInt } from "../core/rng";
import type { ActorState, GameState } from "../core/state-schema";
import { evaluateCondition } from "../narrative/conditions";
import type { Emit } from "../narrative/effects";
import type { WorldDefinition } from "../world/schema";
import { dealDamage } from "./actions";
import { lootConvoy, transferOwnedArtifacts } from "./ownership";
import { useSkill } from "./skills";
import { RESOURCE_IDS, emptyResources } from "../core/primitives";
import { awardExperience } from "../expedition/progression";

const activeTeam = (state: GameState, convoyId: string): ActorState[] =>
  (state.convoys[convoyId]?.actorIds ?? []).flatMap((id) => {
    const actor = state.actors[id];
    return actor?.status === "active" ? [actor] : [];
  });
export function currentCombatActor(state: GameState): ActorState | null {
  const id = state.combat?.turnOrder[state.combat.turnIndex];
  return id ? (state.actors[id] ?? null) : null;
}

export function startCombat(
  state: GameState,
  enemyConvoyId: string,
  ambush: boolean,
  emit: Emit,
): void {
  const player = state.convoys[state.player.convoyId];
  const enemy = state.convoys[enemyConvoyId];
  if (state.combat)
    throw new CommandError("COMBAT_ACTIVE", "Combat already active");
  if (
    !player ||
    !enemy ||
    enemy.locationId !== player.locationId ||
    activeTeam(state, enemyConvoyId).length === 0
  )
    throw new CommandError(
      "REQUIREMENTS_NOT_MET",
      "Rival is absent or cannot fight.",
    );
  state.combat = {
    id: `combat.${state.commandLog.length + 1}`,
    enemyConvoyId,
    phase: "active",
    round: 1,
    turnOrder: [
      ...activeTeam(state, player.id),
      ...activeTeam(state, enemy.id),
    ].map((actor) => actor.id),
    turnIndex: 0,
    defendedActorIds: [],
    vulnerableActorIds: [],
    panickedActorIds: [],
    bleedingActorIds: [],
    log: [],
  };
  if (ambush)
    activeTeam(state, enemy.id).forEach((actor) => {
      actor.health = Math.max(1, actor.health - 10);
    });
  state.activeEvents = [];
  emit({ type: "combat.started", combatId: state.combat.id, enemyConvoyId });
}

function checkBattleEnd(
  state: GameState,
  definition: WorldDefinition,
  emit: Emit,
): boolean {
  const combat = state.combat;
  if (!combat) return true;
  if (combat.phase === "aftermath") return true;
  if (activeTeam(state, state.player.convoyId).length === 0) {
    lootConvoy(state, state.player.convoyId, combat.enemyConvoyId, emit);
    state.combat = null;
    emit({ type: "combat.ended", result: "defeat" });
    return true;
  }
  if (activeTeam(state, combat.enemyConvoyId).length === 0) {
    combat.phase = "aftermath";
    combat.turnIndex = combat.turnOrder.findIndex(
      (id) =>
        state.actors[id]?.convoyId === state.player.convoyId &&
        state.actors[id]?.status === "active",
    );
    const player = state.convoys[state.player.convoyId];
    const before = player ? { ...player.resources } : emptyResources();
    lootConvoy(state, combat.enemyConvoyId, state.player.convoyId, emit);
    const encounter = definition.campaign?.encounters?.find(
      (entry) => entry.convoyId === combat.enemyConvoyId,
    );
    if (encounter) establishFact(state, encounter.victoryFactId, true);
    else {
      establishFact(state, "rival.resolved", true);
      establishFact(state, "rival.defeated", true);
    }
    if (definition.campaign?.operations && player) {
      const xp =
        encounter?.rewardXp ??
        definition.campaign.operations.progression.rivalXp;
      awardExperience(state, xp, definition, emit);
      const rewards = emptyResources();
      RESOURCE_IDS.forEach((id) => {
        rewards[id] = player.resources[id] - before[id];
      });
      emit({
        type: "combat.victory",
        enemyConvoyId: combat.enemyConvoyId,
        rewards,
        xp,
      });
    }
    const npc = state.world.npcs[combat.enemyConvoyId];
    if (npc) npc.intent = "defeated";
    return true;
  }
  return false;
}

function advanceTurn(
  state: GameState,
  definition: WorldDefinition,
  emit: Emit,
): void {
  const combat = state.combat;
  if (!combat || checkBattleEnd(state, definition, emit)) return;
  for (let step = 0; step < combat.turnOrder.length * 2; step += 1) {
    combat.turnIndex = (combat.turnIndex + 1) % combat.turnOrder.length;
    if (combat.turnIndex === 0) combat.round += 1;
    const actor = currentCombatActor(state);
    if (!actor || actor.status !== "active") continue;
    combat.defendedActorIds = combat.defendedActorIds.filter(
      (id) => id !== actor.id,
    );
    combat.vulnerableActorIds =
      combat.vulnerableActorIds?.filter((id) => id !== actor.id) ?? [];
    if (combat.bleedingActorIds?.includes(actor.id)) {
      actor.health = Math.max(0, actor.health - 4);
      if (actor.health === 0) actor.status = "downed";
      combat.log.push(
        `${actor.name} mất 4 HP vì vết thương rách toạc (Chảy máu)!`,
      );
      emit({
        type: "combat.action",
        actorId: actor.id,
        action: "attack",
        targetId: actor.id,
        amount: 4,
      });
      if (actor.status !== "active") {
        if (checkBattleEnd(state, definition, emit)) return;
        continue;
      }
    }
    actor.energy = Math.min(
      actor.attributes?.maxEnergy ?? 6,
      (actor.energy ?? 0) + 1,
    );
    if (actor.convoyId === state.player.convoyId) return;
    const target = activeTeam(state, state.player.convoyId).sort(
      (a, b) => a.health - b.health || (a.id < b.id ? -1 : 1),
    )[0];
    if (!target) {
      checkBattleEnd(state, definition, emit);
      return;
    }
    dealDamage(state, actor.id, target.id, 0, definition, emit);
    const vehicle = state.convoys[state.player.convoyId]?.vehicle;
    if (vehicle) vehicle.condition = Math.max(0, vehicle.condition - 2);
    if (checkBattleEnd(state, definition, emit)) return;
  }
  throw new Error("Combat turn order has no active player");
}

export function resolveCombatCommand(
  state: GameState,
  payload: Extract<GameCommand["payload"], { type: "combat" | "use-skill" }>,
  definition: WorldDefinition,
  emit: Emit,
): void {
  const combat = state.combat;
  if (!combat) throw new CommandError("NO_COMBAT", "No active combat");
  const actor = currentCombatActor(state);
  if (
    !actor ||
    actor.id !== payload.actorId ||
    actor.convoyId !== state.player.convoyId ||
    actor.status !== "active"
  )
    throw new CommandError(
      "NOT_YOUR_TURN",
      "Only the current active actor may act.",
    );
  const enemy = state.convoys[combat.enemyConvoyId];
  const convoy = state.convoys[state.player.convoyId];
  if (!enemy || !convoy) throw new Error("Missing combat convoy");
  const encounter = definition.campaign?.encounters?.find(
    (entry) => entry.convoyId === enemy.id,
  );
  const capturedFact = encounter?.capturedFactId ?? "rival.captured";
  if (payload.type === "use-skill") {
    if (combat.phase !== "active")
      throw new CommandError("SKILL_UNAVAILABLE", "Battle is over");
    useSkill(
      state,
      payload.actorId,
      payload.skillId,
      payload.targetId,
      definition,
      emit,
    );
    advanceTurn(state, definition, emit);
    return;
  }
  if (combat.phase === "aftermath") {
    if (payload.action === "capture") {
      const target = payload.targetId
        ? state.actors[payload.targetId]
        : undefined;
      if (!target || target.convoyId !== enemy.id || target.status !== "downed")
        throw new CommandError(
          "INVALID_TARGET",
          "Only downed opponents can be captured.",
        );
      target.status = "captured";
      establishFact(state, capturedFact, true);
      emit({
        type: "combat.action",
        actorId: actor.id,
        action: "capture",
        targetId: target.id,
        amount: 0,
      });
      return;
    }
    if (payload.action !== "finish")
      throw new CommandError(
        "REQUIREMENTS_NOT_MET",
        "Capture prisoners or finish the battle.",
      );
    enemy.actorIds.forEach((id) => {
      const target = state.actors[id];
      if (target?.status === "downed") target.status = "dead";
    });
    if (enemy.actorIds.every((id) => state.actors[id]?.status === "dead"))
      establishFact(state, encounter?.deadFactId ?? "rival.dead", true);
    state.combat = null;
    emit({ type: "combat.ended", result: "victory" });
    return;
  }
  switch (payload.action) {
    case "attack":
      if (!payload.targetId)
        throw new CommandError("INVALID_TARGET", "Select a target");
      dealDamage(state, actor.id, payload.targetId, 0, definition, emit);
      break;
    case "defend":
      if (!combat.defendedActorIds.includes(actor.id))
        combat.defendedActorIds.push(actor.id);
      emit({
        type: "combat.action",
        actorId: actor.id,
        action: "defend",
        amount: 0,
      });
      break;
    case "retreat": {
      if (convoy.resources.fuel < 2)
        throw new CommandError(
          "INSUFFICIENT_RESOURCES",
          "Retreat requires 2 fuel",
        );
      convoy.resources.fuel -= 2;
      const roll = nextInt(state.rng, 10000);
      state.rng = roll.rng;
      if (roll.value < 8000) {
        convoy.vehicle.condition = Math.max(0, convoy.vehicle.condition - 5);
        if (encounter) establishFact(state, encounter.escapeFactId, true);
        else {
          establishFact(state, "rival.resolved", true);
          establishFact(state, "rival.escaped", true);
        }
        state.combat = null;
        emit({ type: "combat.ended", result: "retreat" });
        return;
      }
      emit({
        type: "combat.action",
        actorId: actor.id,
        action: "retreat-failed",
        amount: 0,
      });
      break;
    }
    case "negotiate": {
      const requirement = encounter
        ? undefined
        : definition.campaign?.rival?.negotiationCondition;
      if (!requirement || !evaluateCondition(state, requirement))
        throw new CommandError(
          "REQUIREMENTS_NOT_MET",
          "Rival refuses to negotiate without evidence or leverage.",
        );
      establishFact(state, "rival.resolved", true);
      establishFact(state, "rival.peaceful", true);
      state.combat = null;
      emit({ type: "combat.ended", result: "negotiated" });
      return;
    }
    case "surrender":
      transferOwnedArtifacts(state, convoy.id, enemy.id, emit);
      convoy.resources.scrap = Math.max(0, convoy.resources.scrap - 4);
      if (encounter) establishFact(state, encounter.escapeFactId, true);
      else {
        establishFact(state, "rival.resolved", true);
        establishFact(state, "rival.surrendered", true);
      }
      state.combat = null;
      emit({ type: "combat.ended", result: "surrendered" });
      return;
    case "capture": {
      const target = payload.targetId
        ? state.actors[payload.targetId]
        : undefined;
      if (!target || target.convoyId !== enemy.id || target.status !== "downed")
        throw new CommandError(
          "INVALID_TARGET",
          "Only downed opponents can be captured",
        );
      target.status = "captured";
      establishFact(state, capturedFact, true);
      emit({
        type: "combat.action",
        actorId: actor.id,
        action: "capture",
        targetId: target.id,
        amount: 0,
      });
      break;
    }
    case "finish":
      throw new CommandError(
        "REQUIREMENTS_NOT_MET",
        "Opponents are still fighting",
      );
  }
  advanceTurn(state, definition, emit);
}

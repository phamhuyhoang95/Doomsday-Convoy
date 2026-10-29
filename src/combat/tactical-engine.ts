import { CommandError } from "../core/commands";
import type { GameCommand } from "../core/commands";
import type { ActorState, GameState } from "../core/state-schema";
import { emptyResources, RESOURCE_IDS } from "../core/primitives";
import { canAfford, subtractResources } from "../core/resources";
import { nextInt } from "../core/rng";
import { establishFact } from "../core/facts";
import { awardExperience, stanceBonus } from "../expedition/progression";
import { evaluateCondition } from "../narrative/conditions";
import type { Emit } from "../narrative/effects";
import type { WorldDefinition } from "../world/schema";
import type { TacticalAbility } from "./tactical-schema";
import { artifactBonus } from "./actions";
import {
  startCombat as startLegacy,
  currentCombatActor,
} from "./legacy-engine";
import { lootConvoy, transferOwnedArtifacts } from "./ownership";

export function battleTeam(state: GameState, convoyId: string): ActorState[] {
  return (state.convoys[convoyId]?.actorIds ?? []).flatMap((id) => {
    const actor = state.actors[id];
    return actor && actor.status === "active" ? [actor] : [];
  });
}

export function isFrontline(state: GameState, actorId: string): boolean {
  const actor = state.actors[actorId];
  const positions = state.combat?.tactics?.positions;
  if (!actor || !positions || positions[actorId] === undefined) return false;
  return (
    positions[actorId] < 2 ||
    !battleTeam(state, actor.convoyId).some((a) => (positions[a.id] ?? 4) < 2)
  );
}

export function attackReason(
  state: GameState,
  actorId: string,
  targetId: string | undefined,
  reach: "front" | "any" = "front",
): string {
  const actor = state.actors[actorId];
  const target = targetId ? state.actors[targetId] : undefined;
  const battle = state.combat;
  if (
    !actor ||
    actor.status !== "active" ||
    !target ||
    target.status !== "active" ||
    !battle ||
    actor.convoyId === target.convoyId ||
    !battle.turnOrder.includes(actor.id) ||
    !battle.turnOrder.includes(target.id)
  )
    return "Chọn mục tiêu đang tham gia trận.";
  if (
    reach === "front" &&
    (!isFrontline(state, actor.id) || !isFrontline(state, target.id))
  )
    return "Cận chiến cần đứng tuyến đầu và nhắm tuyến đầu.";
  return "";
}

function tacticalDamage(
  state: GameState,
  actorId: string,
  targetId: string,
  definition: WorldDefinition,
  roll: number,
  ability?: TacticalAbility,
  capToTarget = true,
): number {
  const a = state.actors[actorId];
  const b = state.actors[targetId];
  if (!a || !b) return 0;
  const statuses = state.combat?.tactics?.statuses ?? [];
  const broken =
    statuses.find((s) => s.actorId === b.id && s.kind === "armor-broken")
      ?.potency ?? 0;
  const guard = statuses.some((s) => s.actorId === b.id && s.kind === "guard");
  const raw =
    (a.attributes?.attack ?? 10) +
    (ability?.power ?? 0) +
    artifactBonus(state, a, definition, "attackBonus") +
    stanceBonus(a, definition, "attack") -
    Math.max(
      0,
      (b.attributes?.defense ?? 2) +
        stanceBonus(b, definition, "defense") +
        artifactBonus(state, b, definition, "defenseBonus") -
        broken,
    );
  const combo =
    ability?.exploitStatus &&
    statuses.some(
      (s) => s.actorId === b.id && s.kind === ability.exploitStatus,
    );
  const damage = Math.max(
    1,
    Math.floor(
      Math.max(1, raw + roll) *
        (combo ? 1 + (ability?.bonusBps ?? 0) / 10000 : 1) *
        (guard ? 0.5 : 1),
    ),
  );
  return capToTarget ? Math.min(b.health, damage) : damage;
}

export function tacticalDamageRange(
  state: GameState,
  actorId: string,
  targetId: string,
  definition: WorldDefinition,
  ability?: TacticalAbility,
): [number, number] {
  return [
    tacticalDamage(state, actorId, targetId, definition, 0, ability),
    tacticalDamage(state, actorId, targetId, definition, 4, ability),
  ];
}

export function abilityReason(
  state: GameState,
  actorId: string,
  ability: TacticalAbility,
  targetId: string | undefined,
): string {
  const actor = state.actors[actorId];
  const battle = state.combat;
  const tactics = battle?.tactics;
  const convoy = actor ? state.convoys[actor.convoyId] : undefined;
  if (
    !actor ||
    !convoy ||
    !tactics ||
    battle?.phase !== "active" ||
    currentCombatActor(state)?.id !== actor.id ||
    actor.status !== "active"
  )
    return "Chưa đến lượt nhân vật.";
  if (ability.source === "actor" && !actor.skillIds?.includes(ability.id))
    return "Nhân vật chưa biết kỹ năng này.";
  if (
    ability.source === "artifact" &&
    !Object.values(state.inventory.artifactInstances).some(
      (a) => a.artifactId === ability.artifactId && a.ownerId === convoy.id,
    )
  )
    return "Đoàn xe chưa sở hữu kỳ vật.";
  if (ability.source === "vehicle" && tactics.vehicleUsedRound === battle.round)
    return "Xe đã hỗ trợ trong vòng này.";
  if ((actor.energy ?? 0) < ability.energyCost) return "Thiếu năng lượng.";
  if (!canAfford(convoy.resources, ability.costs)) return "Thiếu vật tư.";
  if (
    (tactics.cooldowns[actor.id]?.[ability.id] ?? 0) >
    (tactics.actorTurns[actor.id] ?? 0)
  )
    return "Kỹ năng đang hồi theo lượt nhân vật.";
  if (ability.target === "enemy")
    return attackReason(state, actor.id, targetId, ability.reach);
  if (ability.target === "vehicle")
    return ability.effect === "repair" &&
      convoy.vehicle.condition === convoy.vehicle.maxCondition
      ? "Xe đang nguyên vẹn."
      : "";
  const target =
    state.actors[ability.target === "self" ? actor.id : (targetId ?? "")];
  if (
    !target ||
    !battle.turnOrder.includes(target.id) ||
    target.convoyId !== actor.convoyId ||
    target.status === "dead" ||
    target.status === "captured"
  )
    return "Chọn đồng đội tham gia trận.";
  if (ability.effect !== "heal" && target.status !== "active")
    return "Đồng đội cần được hồi phục trước.";
  if (
    ability.effect === "heal" &&
    target.health === target.maxHealth &&
    !tactics.statuses.some((s) => s.actorId === target.id && s.kind === "bleed")
  )
    return "Đồng đội đã đầy máu.";
  return "";
}

export function startTacticalCombat(
  state: GameState,
  enemyConvoyId: string,
  ambush: boolean,
  definition: WorldDefinition,
  emit: Emit,
): void {
  const player = battleTeam(state, state.player.convoyId);
  const enemy = battleTeam(state, enemyConvoyId);
  if (player.length > 4 || enemy.length > 4)
    throw new CommandError(
      "REQUIREMENTS_NOT_MET",
      "Đội hình tối đa 4 người mỗi phe.",
    );
  startLegacy(state, enemyConvoyId, ambush, emit);
  if (!state.combat || !definition.campaign?.tactics)
    throw new Error("Missing tactical battle");
  // Preserve roster turn order; place the medic behind the leader/mechanic.
  const positions: Record<string, number> = {};
  for (const team of [player, enemy]) {
    const ordered = [...team].sort(
      (a, b) =>
        Number(
          a.skillIds?.some((id) =>
            definition.campaign?.tactics?.abilities.some(
              (s) => s.id === id && s.effect === "heal",
            ),
          ),
        ) -
        Number(
          b.skillIds?.some((id) =>
            definition.campaign?.tactics?.abilities.some(
              (s) => s.id === id && s.effect === "heal",
            ),
          ),
        ),
    );
    ordered.forEach((actor, i) => {
      positions[actor.id] = i;
    });
  }
  state.combat.tactics = {
    positions,
    statuses: [],
    actorTurns: Object.fromEntries(state.combat.turnOrder.map((id) => [id, 0])),
    cooldowns: {},
    vehicleUsedRound: 0,
  };
}

function status(
  state: GameState,
  targetId: string,
  sourceId: string,
  data: NonNullable<TacticalAbility["appliesStatus"]>,
  emit: Emit,
): void {
  const tactics = state.combat?.tactics;
  if (!tactics) throw new Error("Missing tactics");
  tactics.statuses = tactics.statuses.filter(
    (s) => s.actorId !== targetId || s.kind !== data.kind,
  );
  tactics.statuses.push({
    actorId: targetId,
    sourceId,
    kind: data.kind,
    potency: data.potency,
    remainingTurns: data.turns,
  });
  emit({
    type: "battle.beat",
    actorId: sourceId,
    targetId,
    effect: "status",
    status: data.kind,
    amount: data.potency,
  });
}

function hit(
  state: GameState,
  actor: ActorState,
  target: ActorState,
  definition: WorldDefinition,
  emit: Emit,
  ability?: TacticalAbility,
): void {
  const roll = nextInt(state.rng, 5);
  state.rng = roll.rng;
  const amount = tacticalDamage(
    state,
    actor.id,
    target.id,
    definition,
    roll.value,
    ability,
    false,
  );
  const combo =
    ability?.exploitStatus &&
    state.combat?.tactics?.statuses.some(
      (s) => s.actorId === target.id && s.kind === ability.exploitStatus,
    );
  const reflected = state.combat?.tactics?.statuses.some(
    (s) => s.actorId === target.id && s.kind === "reflect",
  );
  const recipient = reflected ? actor : target;
  if (reflected && state.combat?.tactics)
    state.combat.tactics.statuses = state.combat.tactics.statuses.filter(
      (s) => !(s.actorId === target.id && s.kind === "reflect"),
    );
  const before = recipient.health;
  recipient.health = Math.max(0, recipient.health - amount);
  if (recipient.health === 0) recipient.status = "downed";
  emit({
    type: "battle.beat",
    actorId: reflected ? target.id : actor.id,
    targetId: recipient.id,
    effect: reflected ? "reflect" : "damage",
    amount: before - recipient.health,
    healthBefore: before,
    healthAfter: recipient.health,
    ...(ability ? { abilityId: ability.id } : {}),
  });
  state.combat?.log.push(
    `${reflected ? target.name : actor.name} → ${recipient.name}: −${before - recipient.health} HP${combo ? " · PHỐI HỢP" : ""}`,
  );
  if (!reflected && target.status === "active" && ability?.appliesStatus)
    status(state, target.id, actor.id, ability.appliesStatus, emit);
}

function battleEnd(
  state: GameState,
  definition: WorldDefinition,
  emit: Emit,
): boolean {
  const battle = state.combat;
  if (!battle || battle.phase === "aftermath") return true;
  if (
    !battleTeam(state, state.player.convoyId).length ||
    state.convoys[state.player.convoyId]?.vehicle.condition === 0
  ) {
    lootConvoy(state, state.player.convoyId, battle.enemyConvoyId, emit);
    state.combat = null;
    emit({ type: "combat.ended", result: "defeat" });
    return true;
  }
  if (battleTeam(state, battle.enemyConvoyId).length) return false;
  const player = state.convoys[state.player.convoyId]!;
  const before = { ...player.resources };
  lootConvoy(state, battle.enemyConvoyId, player.id, emit);
  const encounter = definition.campaign?.encounters?.find(
    (e) => e.convoyId === battle.enemyConvoyId,
  );
  establishFact(state, encounter?.victoryFactId ?? "rival.resolved", true);
  if (!encounter) establishFact(state, "rival.defeated", true);
  const xp =
    encounter?.rewardXp ??
    definition.campaign?.operations?.progression.rivalXp ??
    0;
  awardExperience(state, xp, definition, emit);
  const rewards = emptyResources();
  RESOURCE_IDS.forEach((id) => {
    rewards[id] = player.resources[id] - before[id];
  });
  emit({
    type: "combat.victory",
    enemyConvoyId: battle.enemyConvoyId,
    rewards,
    xp,
  });
  const npc = state.world.npcs[battle.enemyConvoyId];
  if (npc) npc.intent = "defeated";
  battle.phase = "aftermath";
  battle.turnIndex = battle.turnOrder.findIndex(
    (id) =>
      state.actors[id]?.convoyId === player.id &&
      state.actors[id]?.status === "active",
  );
  return true;
}

export function enemyIntent(
  state: GameState,
  actorId: string,
  atActivation = false,
) {
  const actor = state.actors[actorId];
  if (!actor || !state.combat?.tactics || actor.status !== "active")
    return null;
  const targets = battleTeam(state, state.player.convoyId);
  const ranged =
    !isFrontline(state, actorId) ||
    state.convoys[actor.convoyId]?.actorIds.indexOf(actor.id) === 1;
  const activation =
    (state.combat.tactics.actorTurns[actorId] ?? 0) + (atActivation ? 0 : 1);
  if (ranged && activation > 0 && activation % 3 === 0)
    return {
      targetId: state.convoys[state.player.convoyId]!.vehicle.id,
      reach: "any" as const,
      vehicle: true,
    };
  const target = targets
    .filter((t) => ranged || isFrontline(state, t.id))
    .sort(
      (a, b) =>
        a.health - b.health || (a.id < b.id ? -1 : a.id === b.id ? 0 : 1),
    )[0];
  return target
    ? {
        targetId: target.id,
        reach: ranged ? ("any" as const) : ("front" as const),
        vehicle: false,
      }
    : null;
}

function advance(
  state: GameState,
  definition: WorldDefinition,
  emit: Emit,
): void {
  if (battleEnd(state, definition, emit)) return;
  const battle = state.combat!;
  const tactics = battle.tactics!;
  for (let i = 0; i < battle.turnOrder.length * 2; i++) {
    battle.turnIndex = (battle.turnIndex + 1) % battle.turnOrder.length;
    if (battle.turnIndex === 0) battle.round++;
    const actor = currentCombatActor(state);
    if (!actor || actor.status !== "active") continue;
    tactics.actorTurns[actor.id] = (tactics.actorTurns[actor.id] ?? 0) + 1;
    for (const s of tactics.statuses.filter((s) => s.actorId === actor.id)) {
      if (s.kind === "bleed") {
        const before = actor.health;
        actor.health = Math.max(0, actor.health - s.potency);
        if (actor.health === 0) actor.status = "downed";
        emit({
          type: "battle.beat",
          actorId: s.sourceId,
          targetId: actor.id,
          effect: "damage",
          amount: before - actor.health,
          healthBefore: before,
          healthAfter: actor.health,
          status: "bleed",
        });
      }
      s.remainingTurns--;
    }
    tactics.statuses = tactics.statuses.filter(
      (s) =>
        s.remainingTurns > 0 && state.actors[s.actorId]?.status === "active",
    );
    if (battleEnd(state, definition, emit)) return;
    if (actor.status !== "active") continue;
    actor.energy = Math.min(
      actor.attributes?.maxEnergy ?? 6,
      (actor.energy ?? 0) + 1,
    );
    if (actor.convoyId === state.player.convoyId) return;
    const intent = enemyIntent(state, actor.id, true);
    const target = intent ? state.actors[intent.targetId] : undefined;
    if (intent?.vehicle) {
      const vehicle = state.convoys[state.player.convoyId]!.vehicle;
      const draw = nextInt(state.rng, 5);
      state.rng = draw.rng;
      const before = vehicle.condition;
      vehicle.condition = Math.max(
        0,
        before -
          Math.max(
            1,
            Math.floor((actor.attributes?.attack ?? 10) / 2) + draw.value,
          ),
      );
      emit({
        type: "battle.beat",
        actorId: actor.id,
        targetId: vehicle.id,
        effect: "damage",
        amount: before - vehicle.condition,
        healthBefore: before,
        healthAfter: vehicle.condition,
      });
      battle.log.push(
        `${actor.name} → ${vehicle.name}: −${before - vehicle.condition} độ bền`,
      );
    } else if (target) hit(state, actor, target, definition, emit);
    if (battleEnd(state, definition, emit)) return;
  }
  throw new Error("Tactical turn order exhausted without player action");
}

export function resolveTacticalCommand(
  state: GameState,
  payload: Extract<
    GameCommand["payload"],
    { type: "combat" | "use-skill" | "battle-action" }
  >,
  definition: WorldDefinition,
  emit: Emit,
): void {
  const battle = state.combat;
  const tactics = battle?.tactics;
  const actor = currentCombatActor(state);
  const convoy = state.convoys[state.player.convoyId];
  if (!battle || !tactics)
    throw new CommandError("NO_COMBAT", "Không có trận chiến.");
  if (
    !actor ||
    !convoy ||
    actor.id !== payload.actorId ||
    actor.convoyId !== convoy.id ||
    actor.status !== "active"
  )
    throw new CommandError("NOT_YOUR_TURN", "Chưa đến lượt nhân vật.");
  const encounter = definition.campaign?.encounters?.find(
    (e) => e.convoyId === battle.enemyConvoyId,
  );
  if (payload.type === "combat") {
    if (payload.action === "capture") {
      const target = state.actors[payload.targetId ?? ""];
      if (
        !target ||
        target.convoyId !== battle.enemyConvoyId ||
        target.status !== "downed"
      )
        throw new CommandError("INVALID_TARGET", "Chỉ bắt đối thủ đã gục.");
      target.status = "captured";
      establishFact(state, encounter?.capturedFactId ?? "rival.captured", true);
      emit({
        type: "combat.action",
        actorId: actor.id,
        targetId: target.id,
        action: "capture",
        amount: 0,
      });
      if (battle.phase !== "aftermath") advance(state, definition, emit);
      return;
    }
    if (payload.action === "finish") {
      if (battle.phase !== "aftermath")
        throw new CommandError(
          "REQUIREMENTS_NOT_MET",
          "Đối thủ vẫn đang chiến đấu.",
        );
      const enemy = state.convoys[battle.enemyConvoyId]!;
      for (const id of enemy.actorIds) {
        const a = state.actors[id];
        if (a?.status === "downed") a.status = "dead";
      }
      if (enemy.actorIds.every((id) => state.actors[id]?.status === "dead"))
        establishFact(state, encounter?.deadFactId ?? "rival.dead", true);
      state.combat = null;
      emit({ type: "combat.ended", result: "victory" });
      return;
    }
    if (battle.phase !== "active")
      throw new CommandError(
        "REQUIREMENTS_NOT_MET",
        "Hãy giải quyết hậu chiến.",
      );
    if (["retreat", "surrender", "negotiate"].includes(payload.action)) {
      let result: "retreat" | "surrendered" | "negotiated";
      if (payload.action === "retreat") {
        if (convoy.resources.fuel < 2)
          throw new CommandError(
            "INSUFFICIENT_RESOURCES",
            "Rút lui cần 2 nhiên liệu.",
          );
        convoy.resources.fuel -= 2;
        convoy.vehicle.condition = Math.max(0, convoy.vehicle.condition - 5);
        result = "retreat";
      } else if (payload.action === "surrender") {
        transferOwnedArtifacts(state, convoy.id, battle.enemyConvoyId, emit);
        result = "surrendered";
      } else {
        if (
          encounter ||
          !definition.campaign?.rival ||
          !evaluateCondition(
            state,
            definition.campaign.rival.negotiationCondition,
          )
        )
          throw new CommandError(
            "REQUIREMENTS_NOT_MET",
            "Đối thủ không chấp nhận đàm phán.",
          );
        result = "negotiated";
      }
      establishFact(state, encounter?.escapeFactId ?? "rival.resolved", true);
      if (!encounter)
        establishFact(
          state,
          result === "negotiated"
            ? "rival.peaceful"
            : result === "retreat"
              ? "rival.escaped"
              : "rival.surrendered",
          true,
        );
      state.combat = null;
      emit({ type: "combat.ended", result });
      return;
    }
  }
  if (battle.phase !== "active")
    throw new CommandError("REQUIREMENTS_NOT_MET", "Trận đã kết thúc.");
  const action =
    payload.type === "use-skill"
      ? "ability"
      : payload.type === "combat"
        ? payload.action === "defend"
          ? "guard"
          : "attack"
        : payload.action;
  if (action === "attack") {
    const reason = attackReason(state, actor.id, payload.targetId);
    if (reason) throw new CommandError("INVALID_TARGET", reason);
    hit(state, actor, state.actors[payload.targetId!]!, definition, emit);
  } else if (action === "guard") {
    status(
      state,
      actor.id,
      actor.id,
      { kind: "guard", turns: 1, potency: 50 },
      emit,
    );
  } else if (action === "move") {
    const slot = payload.type === "battle-action" ? payload.slot : undefined;
    if (slot === undefined || slot === tactics.positions[actor.id])
      throw new CommandError("INVALID_MOVE", "Chọn vị trí khác.");
    const occupant = battle.turnOrder
      .map((id) => state.actors[id])
      .find(
        (a) =>
          a?.convoyId === actor.convoyId && tactics.positions[a.id] === slot,
      );
    if (occupant && occupant.status !== "active")
      throw new CommandError(
        "INVALID_MOVE",
        "Vị trí còn người gục, cần cứu trước.",
      );
    if (occupant) tactics.positions[occupant.id] = tactics.positions[actor.id]!;
    tactics.positions[actor.id] = slot;
    emit({
      type: "battle.beat",
      actorId: actor.id,
      targetId: actor.id,
      effect: "move",
      amount: slot,
    });
  } else {
    const id =
      payload.type === "use-skill"
        ? payload.skillId
        : payload.type === "battle-action"
          ? payload.abilityId
          : undefined;
    const ability = definition.campaign?.tactics?.abilities.find(
      (a) => a.id === id,
    );
    if (!ability)
      throw new CommandError("SKILL_UNAVAILABLE", "Không tìm thấy kỹ năng.");
    const reason = abilityReason(state, actor.id, ability, payload.targetId);
    if (reason) throw new CommandError("SKILL_UNAVAILABLE", reason);
    convoy.resources = subtractResources(convoy.resources, ability.costs);
    actor.energy = (actor.energy ?? 0) - ability.energyCost;
    tactics.cooldowns[actor.id] ??= {};
    tactics.cooldowns[actor.id]![ability.id] =
      (tactics.actorTurns[actor.id] ?? 0) + ability.cooldownTurns + 1;
    if (ability.source === "vehicle") tactics.vehicleUsedRound = battle.round;
    const target =
      state.actors[
        ability.target === "self" ? actor.id : (payload.targetId ?? actor.id)
      ]!;
    if (ability.effect === "damage")
      hit(state, actor, target, definition, emit, ability);
    else if (ability.effect === "heal") {
      const before = target.health;
      target.health = Math.min(target.maxHealth, target.health + ability.power);
      if (target.health > 0) target.status = "active";
      tactics.statuses = tactics.statuses.filter(
        (s) => s.actorId !== target.id || s.kind !== "bleed",
      );
      emit({
        type: "battle.beat",
        actorId: actor.id,
        targetId: target.id,
        effect: "heal",
        amount: target.health - before,
        healthBefore: before,
        healthAfter: target.health,
        abilityId: ability.id,
      });
    } else if (ability.effect === "repair") {
      const before = convoy.vehicle.condition;
      convoy.vehicle.condition = Math.min(
        convoy.vehicle.maxCondition,
        before + ability.power,
      );
      emit({
        type: "battle.beat",
        actorId: actor.id,
        targetId: convoy.vehicle.id,
        effect: "repair",
        amount: convoy.vehicle.condition - before,
        healthBefore: before,
        healthAfter: convoy.vehicle.condition,
        abilityId: ability.id,
      });
    } else
      status(
        state,
        target.id,
        actor.id,
        ability.appliesStatus ?? {
          kind: ability.effect === "reflect" ? "reflect" : "guard",
          turns: 1,
          potency: 50,
        },
        emit,
      );
    emit({
      type: "resources.consumed",
      convoyId: convoy.id,
      costs: ability.costs,
      reason: "skill",
    });
    emit({ type: "skill.used", actorId: actor.id, skillId: ability.id });
  }
  advance(state, definition, emit);
}

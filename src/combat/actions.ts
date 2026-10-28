import { CommandError } from "../core/commands";
import { nextInt } from "../core/rng";
import type { ActorState, GameState } from "../core/state-schema";
import type { Emit } from "../narrative/effects";
import type { WorldDefinition } from "../world/schema";
import { stanceBonus } from "../expedition/progression";

export function artifactBonus(
  state: GameState,
  actor: ActorState,
  definition: WorldDefinition,
  kind: "attackBonus" | "defenseBonus",
): number {
  return Object.values(state.inventory.artifactInstances)
    .filter((entry) => entry.ownerId === actor.convoyId)
    .reduce(
      (sum, entry) =>
        sum +
        (definition.campaign?.artifacts.find(
          (artifact) => artifact.id === entry.artifactId,
        )?.[kind] ?? 0),
      0,
    );
}

export function dealDamage(
  state: GameState,
  attackerId: string,
  targetId: string,
  power: number,
  definition: WorldDefinition,
  emit: Emit,
  action = "attack",
): void {
  const attacker = state.actors[attackerId];
  const target = state.actors[targetId];
  if (
    !attacker ||
    !target ||
    target.status !== "active" ||
    target.convoyId === attacker.convoyId
  )
    throw new CommandError("INVALID_TARGET", "Select an active enemy.");
  const battle = state.combat;
  if (
    definition.campaign?.operations &&
    battle &&
    !(
      (attacker.convoyId === state.player.convoyId &&
        target.convoyId === battle.enemyConvoyId) ||
      (attacker.convoyId === battle.enemyConvoyId &&
        target.convoyId === state.player.convoyId)
    )
  )
    throw new CommandError(
      "INVALID_TARGET",
      "Target must participate in this battle.",
    );
  const roll = nextInt(state.rng, 5);
  state.rng = roll.rng;
  const damage = damageForRoll(
    state,
    attacker,
    target,
    power,
    definition,
    roll.value,
  );
  const isVulnerable =
    state.combat?.vulnerableActorIds?.includes(target.id) ?? false;
  target.health -= damage;
  if (target.health === 0) target.status = "downed";
  const critNote = isVulnerable ? " (LỘ ĐIỂM YẾU +40%)" : "";
  state.combat?.log.push(
    `${attacker.name} → ${target.name}: ${damage}${critNote}`,
  );
  emit({
    type: "combat.action",
    actorId: attacker.id,
    action,
    targetId: target.id,
    amount: damage,
  });
}

function damageForRoll(
  state: GameState,
  attacker: ActorState,
  target: ActorState,
  power: number,
  definition: WorldDefinition,
  roll: number,
): number {
  const guarded = state.combat?.defendedActorIds.includes(target.id) ?? false;
  const isVulnerable =
    state.combat?.vulnerableActorIds?.includes(target.id) ?? false;
  const isPanicked =
    state.combat?.panickedActorIds?.includes(attacker.id) ?? false;

  const baseAttack = attacker.attributes?.attack ?? 10;
  const effectiveAttack = isPanicked
    ? Math.max(1, Math.floor(baseAttack * 0.7))
    : baseAttack;

  let raw =
    effectiveAttack +
    power +
    roll +
    artifactBonus(state, attacker, definition, "attackBonus") +
    stanceBonus(attacker, definition, "attack") -
    (target.attributes?.defense ?? 2) -
    stanceBonus(target, definition, "defense") -
    artifactBonus(state, target, definition, "defenseBonus");

  if (isVulnerable && raw > 0) {
    raw = Math.floor(raw * 1.4);
  }

  return Math.min(
    target.health,
    Math.max(1, guarded ? Math.floor(raw / 2) : raw),
  );
}

export function damageRange(
  state: GameState,
  attackerId: string,
  targetId: string,
  power: number,
  definition: WorldDefinition,
): [number, number] {
  const a = state.actors[attackerId];
  const b = state.actors[targetId];
  if (!a || !b) return [0, 0];
  return [
    damageForRoll(state, a, b, power, definition, 0),
    damageForRoll(state, a, b, power, definition, 4),
  ];
}

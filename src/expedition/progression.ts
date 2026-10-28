import { CommandError } from "../core/commands";
import type { ActorState, GameState } from "../core/state-schema";
import type { Emit } from "../narrative/effects";
import type { WorldDefinition } from "../world/schema";

export function initializeProgression(
  actor: ActorState,
  definition: WorldDefinition,
): void {
  const config = definition.campaign?.operations;
  if (!config || actor.convoyId !== definition.start.convoyId) return;
  const stance = config.stances[0];
  if (!stance) throw new Error("No starting stance");
  actor.progression = {
    xp: 0,
    points: config.progression.startingPoints,
    upgrades: {},
    stanceId: stance.id,
  };
}

export function awardExperience(
  state: GameState,
  amount: number,
  definition: WorldDefinition,
  emit: Emit,
): void {
  const config = definition.campaign?.operations;
  if (!config || amount === 0) return;
  for (const actor of Object.values(state.actors)) {
    if (
      actor.convoyId !== state.player.convoyId ||
      actor.status === "dead" ||
      actor.status === "captured" ||
      !actor.progression
    )
      continue;
    const previous = actor.progression.xp;
    actor.progression.xp += amount;
    const pointsGained =
      Math.floor(actor.progression.xp / config.progression.xpPerPoint) -
      Math.floor(previous / config.progression.xpPerPoint);
    actor.progression.points += pointsGained;
    emit({
      type: "actor.progressed",
      actorId: actor.id,
      xp: amount,
      pointsGained,
    });
  }
}

export function configureActor(
  state: GameState,
  actorId: string,
  change: { upgradeId: string } | { stanceId: string },
  definition: WorldDefinition,
  emit: Emit,
): void {
  const config = definition.campaign?.operations;
  const actor = state.actors[actorId];
  if (
    !config ||
    !actor ||
    actor.convoyId !== state.player.convoyId ||
    actor.status !== "active" ||
    !actor.progression ||
    !actor.attributes
  )
    throw new CommandError(
      "REQUIREMENTS_NOT_MET",
      "Nhân vật chưa thể tùy chỉnh.",
    );
  if ("stanceId" in change) {
    if (
      !config.stances.some((stance) => stance.id === change.stanceId) ||
      actor.progression.stanceId === change.stanceId
    )
      throw new CommandError(
        "REQUIREMENTS_NOT_MET",
        "Thế đánh không hợp lệ hoặc đang được sử dụng.",
      );
    actor.progression.stanceId = change.stanceId;
    emit({ type: "actor.configured", actorId, stanceId: change.stanceId });
    return;
  }
  const upgrade = config.upgrades.find(
    (entry) => entry.id === change.upgradeId,
  );
  if (!upgrade || actor.progression.points < 1)
    throw new CommandError("REQUIREMENTS_NOT_MET", "Cần 1 điểm huấn luyện.");
  actor.progression.points -= 1;
  actor.progression.upgrades[upgrade.id] =
    (actor.progression.upgrades[upgrade.id] ?? 0) + 1;
  if (upgrade.attribute === "maxHealth") {
    actor.maxHealth += upgrade.amount;
    actor.health += upgrade.amount;
  } else if (upgrade.attribute === "maxEnergy") {
    actor.attributes.maxEnergy += upgrade.amount;
    actor.energy = (actor.energy ?? 0) + upgrade.amount;
  } else actor.attributes.attack += upgrade.amount;
  emit({ type: "actor.configured", actorId, upgradeId: upgrade.id });
}

export function stanceBonus(
  actor: ActorState,
  definition: WorldDefinition,
  attribute: "attack" | "defense",
): number {
  return (
    definition.campaign?.operations?.stances.find(
      (stance) => stance.id === actor.progression?.stanceId,
    )?.[attribute] ?? 0
  );
}

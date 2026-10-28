import { CommandError } from "../core/commands";
import { establishFact } from "../core/facts";
import { RESOURCE_IDS, emptyResources } from "../core/primitives";
import type { GameState } from "../core/state-schema";
import type { Emit } from "../narrative/effects";
import type { WorldDefinition } from "../world/schema";
import { awardExperience } from "./progression";

export function scoutLocation(
  state: GameState,
  definition: WorldDefinition,
  emit: Emit,
  skillBonus = 0,
): void {
  const config = definition.campaign?.operations;
  const expedition = state.campaign?.operations;
  const convoy = state.convoys[state.player.convoyId];
  if (!config || !expedition || !convoy)
    throw new CommandError(
      "REQUIREMENTS_NOT_MET",
      "Trinh sát cần hành trình R1.",
    );
  const profile = config.recon.find(
    (entry) => entry.locationId === convoy.locationId,
  );
  if (!profile)
    throw new CommandError(
      "REQUIREMENTS_NOT_MET",
      "Không có khu vực để trinh sát.",
    );
  const previous = expedition.recon[convoy.locationId];
  if (!skillBonus && previous && previous.expiresAt > state.world.tick - 1)
    throw new CommandError(
      "REQUIREMENTS_NOT_MET",
      "Thông tin trinh sát vẫn còn hiệu lực. Hãy tận dụng để di chuyển.",
    );
  const firstVisit = !previous;
  const rewards = firstVisit ? { ...profile.rewards } : emptyResources();
  for (const resource of RESOURCE_IDS) {
    if (convoy.resources[resource] + rewards[resource] > 1_000_000)
      throw new CommandError("REQUIREMENTS_NOT_MET", "Kho vật tư đã đầy.");
    convoy.resources[resource] += rewards[resource];
  }
  profile.factIds.forEach((id) => establishFact(state, id, true));
  const intel = {
    scoutedAt: state.world.tick,
    expiresAt: state.world.tick + profile.duration,
    riskReductionBps: Math.min(9000, profile.riskReductionBps + skillBonus),
  };
  expedition.recon[convoy.locationId] = intel;
  if (firstVisit)
    awardExperience(state, config.progression.scoutXp, definition, emit);
  emit({
    type: "expedition.scouted",
    locationId: convoy.locationId,
    firstVisit,
    expiresAt: intel.expiresAt,
    riskReductionBps: intel.riskReductionBps,
    rewards,
  });
}

export function restConvoy(
  state: GameState,
  ticks: number,
  definition: WorldDefinition,
  emit: Emit,
): void {
  const config = definition.campaign?.operations;
  if (!config) return;
  let healthRestored = 0;
  let energyRestored = 0;
  for (const actor of Object.values(state.actors)) {
    if (actor.convoyId !== state.player.convoyId || actor.status !== "active")
      continue;
    const health = Math.min(
      actor.maxHealth - actor.health,
      config.rest.healthPerTick * ticks,
    );
    const energy = Math.min(
      (actor.attributes?.maxEnergy ?? 0) - (actor.energy ?? 0),
      config.rest.energyPerTick * ticks,
    );
    actor.health += health;
    actor.energy = (actor.energy ?? 0) + energy;
    healthRestored += health;
    energyRestored += energy;
  }
  emit({ type: "expedition.rested", ticks, healthRestored, energyRestored });
}

export function repairVehicle(
  state: GameState,
  definition: WorldDefinition,
  emit: Emit,
): void {
  const config = definition.campaign?.operations?.repair;
  const convoy = state.convoys[state.player.convoyId];
  if (!config || !convoy)
    throw new CommandError("REQUIREMENTS_NOT_MET", "Chưa có dụng cụ sửa xe.");
  if (convoy.vehicle.condition >= convoy.vehicle.maxCondition)
    throw new CommandError("REQUIREMENTS_NOT_MET", "Xe đang nguyên vẹn.");
  if (convoy.resources.scrap < config.scrapCost)
    throw new CommandError(
      "INSUFFICIENT_RESOURCES",
      `Cần ${config.scrapCost} phế liệu để sửa xe.`,
    );
  convoy.resources.scrap -= config.scrapCost;
  const amount = Math.min(
    config.condition,
    convoy.vehicle.maxCondition - convoy.vehicle.condition,
  );
  convoy.vehicle.condition += amount;
  emit({ type: "vehicle.repaired", amount, scrapCost: config.scrapCost });
}

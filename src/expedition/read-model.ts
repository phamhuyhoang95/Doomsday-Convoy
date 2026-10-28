import { canAfford, supplyCosts } from "../core/resources";
import type { GameState } from "../core/state-schema";
import type { WorldDefinition } from "../world/schema";

export function operationPreview(
  state: GameState,
  action: "investigate" | "wait" | "repair",
  definition: WorldDefinition,
  ticks = 1,
) {
  const convoy = state.convoys[state.player.convoyId];
  const config = definition.campaign?.operations;
  if (!convoy) throw new Error("Missing convoy");
  const costs = supplyCosts(
    state,
    convoy,
    action === "wait" ? ticks : 1,
    definition,
  );
  if (action === "repair" && config) costs.scrap += config.repair.scrapCost;
  let reason = !config
    ? "Hành động cải tiến chỉ có trong chuyến mới R1."
    : state.combat
      ? "Giải quyết trận chiến trước."
      : state.status !== "active"
        ? "Hành trình đã kết thúc."
        : !canAfford(convoy.resources, costs)
          ? "Không đủ khẩu phần hoặc vật tư."
          : "";
  const profile = config?.recon.find(
    (entry) => entry.locationId === convoy.locationId,
  );
  const intel = state.campaign?.operations?.recon[convoy.locationId];
  const crew = convoy.actorIds.flatMap((id) =>
    state.actors[id]?.status === "active" ? [state.actors[id]!] : [],
  );
  const health = crew.reduce(
    (sum, actor) =>
      sum +
      Math.min(
        actor.maxHealth - actor.health,
        (config?.rest.healthPerTick ?? 0) * ticks,
      ),
    0,
  );
  const energy = crew.reduce(
    (sum, actor) =>
      sum +
      Math.min(
        (actor.attributes?.maxEnergy ?? 0) - (actor.energy ?? 0),
        (config?.rest.energyPerTick ?? 0) * ticks,
      ),
    0,
  );
  if (
    action === "investigate" &&
    (!profile || (intel && intel.expiresAt > state.world.tick))
  )
    reason ||=
      "Intel vẫn còn hiệu lực. Dùng lợi thế để lên đường; cache ở đây chỉ nhận một lần.";
  if (
    action === "repair" &&
    convoy.vehicle.condition >= convoy.vehicle.maxCondition
  )
    reason ||= "Xe còn nguyên vẹn.";
  return {
    enabled: !reason,
    reason,
    costs,
    health,
    energy,
    profile,
    cacheAvailable: !intel,
    condition: config
      ? Math.min(
          config.repair.condition,
          convoy.vehicle.maxCondition - convoy.vehicle.condition,
        )
      : 0,
    remainingIntel: Math.max(0, (intel?.expiresAt ?? 0) - state.world.tick),
    reserveHours: Math.floor(
      Math.min(
        convoy.resources.food / supplyCosts(state, convoy, 1, definition).food,
        convoy.resources.water /
          supplyCosts(state, convoy, 1, definition).water,
      ),
    ),
  };
}

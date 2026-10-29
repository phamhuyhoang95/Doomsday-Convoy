import type { GameState } from "../core/state-schema";
import type { WorldDefinition } from "../world/schema";
import { CommandError } from "../core/commands";
import { canAfford, subtractResources } from "../core/resources";
import type { Emit } from "../narrative/effects";
export function ascensionPreview(
  state: GameState,
  actorId: string,
  pathwayId: string,
  definition: WorldDefinition,
) {
  const actor = state.actors[actorId];
  const path = definition.campaign?.resonance?.pathways.find(
    (p) => p.id === pathwayId,
  );
  const nextTier = actor?.pathway ? actor.pathway.tier - 1 : 9;
  const tier = path?.tiers.find((t) => t.tier === nextTier);
  const convoy = state.convoys[state.player.convoyId];
  const availableXp =
    (actor?.progression?.xp ?? 0) - (actor?.pathway?.spentXp ?? 0);
  let reason =
    state.status !== "active" ||
    state.combat ||
    (state.scenario && !state.scenario.installedModuleId)
      ? "Chỉ thức tỉnh tại điểm dừng an toàn, ngoài nhiệm vụ/giao chiến."
      : !actor ||
          actor.convoyId !== state.player.convoyId ||
          actor.status !== "active" ||
          !actor.progression
        ? "Cần thành viên còn hoạt động của đoàn."
        : !path
          ? "Con đường không tồn tại trong hành trình này."
          : actor.pathway && actor.pathway.pathwayId !== pathwayId
            ? "Đã gắn kết một con đường. Chuyển ngạch chưa mở."
            : !tier
              ? "Đã đạt bậc cao nhất của hành trình này."
              : !state.knowledge.factIds.includes(tier.knowledgeId)
                ? "Cần hồ sơ cộng hưởng của giai đoạn tiếp theo."
                : availableXp < tier.xpCost
                  ? `Cần ${tier.xpCost} XP khả dụng.`
                  : (state.campaign?.occultRemnants ?? 0) < tier.remnantCost
                    ? `Cần ${tier.remnantCost} di vật cộng hưởng.`
                    : !convoy || !canAfford(convoy.resources, tier.costs)
                      ? "Không đủ vật tư nghi thức."
                      : "";
  return { enabled: !reason, reason, path, tier, availableXp };
}
export function ascendPathway(
  state: GameState,
  actorId: string,
  pathwayId: string,
  definition: WorldDefinition,
  emit: Emit,
) {
  const preview = ascensionPreview(state, actorId, pathwayId, definition);
  if (!preview.enabled || !preview.tier)
    throw new CommandError("REQUIREMENTS_NOT_MET", preview.reason);
  const actor = state.actors[actorId]!;
  const tier = preview.tier;
  const convoy = state.convoys[state.player.convoyId]!;
  convoy.resources = subtractResources(convoy.resources, tier.costs);
  state.campaign!.occultRemnants =
    (state.campaign!.occultRemnants ?? 0) - tier.remnantCost;
  actor.pathway = {
    pathwayId,
    tier: tier.tier,
    spentXp: (actor.pathway?.spentXp ?? 0) + tier.xpCost,
  };
  actor.skillIds = [...new Set([...(actor.skillIds ?? []), tier.skillId])];
  emit({
    type: "actor.ascended",
    actorId,
    pathwayId,
    tier: tier.tier,
    skillId: tier.skillId,
    xpSpent: tier.xpCost,
    remnantsSpent: tier.remnantCost,
  });
}

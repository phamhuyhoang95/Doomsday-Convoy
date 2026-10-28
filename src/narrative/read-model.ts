import { canAfford, subtractResources, supplyCosts } from "../core/resources";
import type { GameState } from "../core/state-schema";
import type { WorldDefinition } from "../world/schema";
import { evaluateCondition } from "./conditions";
import type { Condition, EventDefinition } from "./schema";

export function choiceAvailability(
  state: GameState,
  choice: EventDefinition["choices"][number],
  definition: WorldDefinition,
): { enabled: boolean; reason: string } {
  const convoy = state.convoys[state.player.convoyId];
  if (!convoy || state.status !== "active" || state.combat)
    return { enabled: false, reason: "Hành động hiện không khả dụng." };
  const supplies = supplyCosts(state, convoy, 1, definition);
  if (!canAfford(convoy.resources, supplies))
    return { enabled: false, reason: "Không đủ khẩu phần cho một lượt." };
  const forecast = {
    ...state,
    convoys: {
      ...state.convoys,
      [convoy.id]: {
        ...convoy,
        resources: subtractResources(convoy.resources, supplies),
      },
    },
  };
  if (!evaluateCondition(forecast, choice.requirements))
    return {
      enabled: false,
      reason: conditionDescription(choice.requirements, definition, forecast),
    };
  if (!canAfford(forecast.convoys[convoy.id]!.resources, choice.costs))
    return {
      enabled: false,
      reason: "Không đủ vật tư (bao gồm khẩu phần một lượt).",
    };
  for (const outcome of choice.outcomes)
    for (const effect of outcome.effects) {
      if (effect.op === "combat") {
        const enemy = state.convoys[effect.enemyConvoyId];
        if (
          !enemy ||
          enemy.locationId !== convoy.locationId ||
          !enemy.actorIds.some((id) => state.actors[id]?.status === "active")
        )
          return {
            enabled: false,
            reason:
              "Đối thủ đang ở nơi khác hoặc không còn khả năng giao chiến. Có thể chờ họ trở lại.",
          };
      }
      if (
        effect.op === "artifact" &&
        !Object.values(state.inventory.artifactInstances).some(
          (instance) =>
            instance.artifactId === effect.artifactId &&
            instance.ownerId === effect.fromOwnerId,
        )
      )
        return { enabled: false, reason: "Kỳ vật đã đổi chủ." };
      if (effect.op === "rescue" && state.actors[effect.actorId])
        return { enabled: false, reason: "Người sống sót đã lên xe." };
    }
  return { enabled: true, reason: "1 lượt · tiêu khẩu phần của đoàn" };
}

export function conditionDescription(
  condition: Condition,
  definition: WorldDefinition,
  state?: GameState,
): string {
  const factText = (id: string): string =>
    definition.campaign?.facts.find((fact) => fact.id === id)?.description ??
    id;
  switch (condition.op) {
    case "always":
      return "Không có điều kiện bổ sung";
    case "all":
      return condition.conditions
        .filter((item) => !state || !evaluateCondition(state, item))
        .map((item) => conditionDescription(item, definition, state))
        .join(" · ");
    case "any":
      return condition.conditions
        .map((item) => conditionDescription(item, definition, state))
        .join(" hoặc ");
    case "not":
      return `Chưa: ${conditionDescription(condition.condition, definition)}`;
    case "known":
      return `Cần manh mối: ${factText(condition.id)}`;
    case "fact":
      return `Cần: ${factText(condition.id)}`;
    case "resource":
      return `Cần ${condition.atLeast} ${condition.resource}`;
    case "at":
      return `Tại ${definition.locations.find((entry) => entry.id === condition.locationId)?.name ?? condition.locationId}`;
    case "owns": {
      const artifact =
        definition.campaign?.artifacts.find(
          (entry) => entry.id === condition.artifactId,
        )?.name ?? condition.artifactId;
      const owner = definition.locations.find(
        (entry) => entry.id === condition.ownerId,
      )?.name;
      return owner
        ? `${artifact} phải còn ở ${owner}`
        : condition.ownerId === definition.start.convoyId
          ? `Đoàn cần sở hữu ${artifact}`
          : `${artifact} phải còn thuộc ${definition.campaign?.rival?.id === condition.ownerId ? definition.campaign.rival.name : condition.ownerId}`;
    }
    case "actor":
      return `Cần ${definition.characters.find((entry) => entry.id === condition.actorId)?.name ?? condition.actorId}: ${condition.status}`;
    case "location":
      return condition.accessible
        ? "Địa điểm phải có thể tiếp cận"
        : "Địa điểm đã bị phong tỏa";
    case "quest":
      return "Cần hoàn tất mục tiêu liên quan";
  }
}

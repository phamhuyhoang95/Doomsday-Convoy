import type { Effect, EventDefinition } from "../narrative/schema";
import type { WorldDefinition } from "../world/schema";
import type { GameState } from "../core/state-schema";
import { supplyCosts } from "../core/resources";

export function choiceTotalCosts(
  state: GameState,
  choice: EventDefinition["choices"][number],
  definition: WorldDefinition,
) {
  const convoy = state.convoys[state.player.convoyId];
  if (!convoy) return choice.costs;
  const supplies = supplyCosts(state, convoy, 1, definition);
  return {
    ...choice.costs,
    food: supplies.food + choice.costs.food,
    water: supplies.water + choice.costs.water,
  };
}

export function effectDescriptions(
  effects: readonly Effect[],
  definition: WorldDefinition,
): string[] {
  return effects.flatMap((effect): string[] => {
    const c = definition.campaign;
    switch (effect.op) {
      case "experience":
        return [`+${effect.amount} XP/người`];
      case "occult-remnants":
        return [`+${effect.amount} di vật cộng hưởng`];
      case "resource":
        return [
          `+${effect.amount} ${{ food: "lương thực", water: "nước", fuel: "nhiên liệu", medicine: "thuốc", scrap: "phế liệu" }[effect.resource]}`,
        ];
      case "damage":
        return [
          `−${effect.amount} ${effect.target === "crew" ? "HP mỗi người" : "tình trạng xe"}`,
        ];
      case "repair":
        return [`+${effect.amount} tình trạng xe`];
      case "restore":
        return [
          `+${effect.amount} HP ${effect.target === "crew" ? "người trên xe" : "người bị bắt"}`,
        ];
      case "rescue":
        return [
          `${definition.characters.find((entry) => entry.id === effect.actorId)?.name} gia nhập · +1 khẩu phần/giờ`,
        ];
      case "artifact":
        return [
          `${effect.toOwnerId === definition.start.convoyId ? "Nhận" : "Giao"} ${c?.artifacts.find((entry) => entry.id === effect.artifactId)?.name}`,
        ];
      case "fact":
        return effect.reveal
          ? [
              c?.facts.find((entry) => entry.id === effect.id)?.description ??
                "Cập nhật câu chuyện",
            ]
          : [];
      case "knowledge":
        return ["Khám phá manh mối mới"];
      case "location":
        return [
          effect.accessible
            ? "Mở lại địa điểm"
            : "Phong tỏa địa điểm · đổi tuyến đi",
        ];
      case "actor":
        return [
          `${definition.characters.find((entry) => entry.id === effect.actorId)?.name}: ${effect.status}`,
        ];
      case "anomaly":
        return effect.obey
          ? ["Học quy tắc, tránh tổn thương"]
          : [
              "Vi phạm quy tắc",
              ...effectDescriptions(
                c?.anomalies.find((entry) => entry.id === effect.anomalyId)
                  ?.violationEffects ?? [],
                definition,
              ),
            ];
      case "combat": {
        const encounter = c?.encounters?.find(
          (entry) => entry.convoyId === effect.enemyConvoyId,
        );
        return [
          "BẮT ĐẦU CHIẾN ĐẤU",
          ...(encounter
            ? [
                `Nếu thắng: ${encounter.resources.food} food · ${encounter.resources.water} water · ${encounter.rewardXp} XP/người`,
              ]
            : ["Nếu thắng: loot tài nguyên/kỳ vật; có thể bắt giữ đối thủ"]),
        ];
      }
    }
  });
}
export function choiceOutcomePreview(
  choice: EventDefinition["choices"][number],
  definition: WorldDefinition,
) {
  const total = choice.outcomes.reduce(
    (sum, outcome) => sum + outcome.weight,
    0,
  );
  return choice.outcomes.map((outcome) => ({
    chance: Math.round((outcome.weight / total) * 100),
    effects: effectDescriptions(outcome.effects, definition),
  }));
}

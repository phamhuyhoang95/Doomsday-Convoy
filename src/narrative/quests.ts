import { evaluateCondition } from "./conditions";
import { applyEffects } from "./effects";
import type { Emit } from "./effects";
import type { GameState } from "../core/state-schema";
import type { WorldDefinition } from "../world/schema";

/** Templates materialize when world facts satisfy their contracts, independent of event order. */
export function updateQuests(
  state: GameState,
  definition: WorldDefinition,
  emit: Emit,
): void {
  // Run termination closes unresolved contracts. Do not execute new gameplay effects after defeat.
  if (state.status === "lost") {
    for (const quest of state.activeQuests)
      if (quest.status === "active") {
        quest.status = "failed";
        quest.resolvedAt = state.world.tick;
        emit({ type: "quest.updated", questId: quest.id, status: "failed" });
      }
    return;
  }
  const templates = definition.campaign?.quests ?? [];
  for (let pass = 0; pass <= templates.length; pass += 1) {
    let changed = false;
    for (const template of templates) {
      let quest = state.activeQuests.find(
        (entry) => entry.templateId === template.id,
      );
      if (!quest) {
        const dependenciesMet = template.dependencies.every((id) =>
          state.activeQuests.some(
            (entry) =>
              entry.templateId === id &&
              (entry.status === "succeeded" || entry.status === "alternative"),
          ),
        );
        if (
          !dependenciesMet ||
          !evaluateCondition(state, template.preconditions)
        )
          continue;
        quest = {
          id: template.id,
          templateId: template.id,
          status: "active",
          startedAt: state.world.tick,
          resolvedAt: null,
          objectives: template.objectives.map((objective) => ({
            id: objective.id,
            complete: false,
          })),
        };
        state.activeQuests.push(quest);
        changed = true;
        emit({ type: "quest.updated", questId: quest.id, status: "active" });
      }
      if (quest.status !== "active") continue;
      quest.objectives = template.objectives.map((objective) => ({
        id: objective.id,
        complete: evaluateCondition(state, objective.when),
      }));
      const resolution = evaluateCondition(state, template.successWhen)
        ? "succeeded"
        : evaluateCondition(state, template.alternateWhen)
          ? "alternative"
          : evaluateCondition(state, template.failureWhen)
            ? "failed"
            : null;
      if (resolution) {
        quest.status = resolution;
        quest.resolvedAt = state.world.tick;
        applyEffects(
          state,
          resolution === "succeeded"
            ? template.onSuccess
            : resolution === "alternative"
              ? template.onAlternate
              : template.onFailure,
          definition,
          emit,
        );
        emit({ type: "quest.updated", questId: quest.id, status: resolution });
        changed = true;
      }
    }
    if (!changed) break;
  }
}

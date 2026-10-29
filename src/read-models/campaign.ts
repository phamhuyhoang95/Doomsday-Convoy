import type { GameState } from "../core/state-schema";
import type { WorldDefinition } from "../world/schema";
export function chapterProgress(state: GameState, definition: WorldDefinition) {
  const chapters = definition.campaign?.resonance?.chapters ?? [];
  const visited = state.knowledge.locationIds;
  const current = Math.max(
    0,
    ...chapters.flatMap((c, i) =>
      c.locationIds.some((id) => visited.includes(id)) ? [i] : [],
    ),
  );
  return chapters.map((chapter, index) => ({
    ...chapter,
    index,
    current: index === current,
    objectives: chapter.objectives.map((o) => ({
      ...o,
      done:
        o.kind === "visit"
          ? visited.includes(o.referenceId)
          : o.kind === "knowledge"
            ? state.knowledge.factIds.includes(o.referenceId)
            : state.world.facts[o.referenceId]?.value === true,
    })),
  }));
}
export function discoveredRecords(
  state: GameState,
  definition: WorldDefinition,
) {
  return (definition.campaign?.resonance?.records ?? []).map((record) =>
    state.knowledge.factIds.includes(record.factId)
      ? { known: true as const, record }
      : { known: false as const, record: null },
  );
}

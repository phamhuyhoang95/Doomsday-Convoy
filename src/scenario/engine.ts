import { resolveScenarioCommand as legacy } from "./legacy-engine";
import { resolveFieldScenario as current } from "./field-engine";
export const resolveScenarioCommand: typeof legacy = (
  state,
  payload,
  definition,
  emit,
) =>
  definition.campaign?.fieldwork
    ? current(state, payload, definition, emit)
    : legacy(state, payload, definition, emit);

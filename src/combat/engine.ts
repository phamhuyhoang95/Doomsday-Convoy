import type { GameCommand } from "../core/commands";
import { CommandError } from "../core/commands";
import type { GameState } from "../core/state-schema";
import type { Emit } from "../narrative/effects";
import type { WorldDefinition } from "../world/schema";
import {
  startCombat as startLegacy,
  resolveCombatCommand as resolveLegacy,
} from "./legacy-engine";
import { startTacticalCombat, resolveTacticalCommand } from "./tactical-engine";

export { currentCombatActor } from "./legacy-engine";

export function startCombat(
  state: GameState,
  enemyConvoyId: string,
  ambush: boolean,
  emit: Emit,
  definition?: WorldDefinition,
): void {
  if (definition?.campaign?.tactics)
    startTacticalCombat(state, enemyConvoyId, ambush, definition, emit);
  else startLegacy(state, enemyConvoyId, ambush, emit);
}

export function resolveCombatCommand(
  state: GameState,
  payload: Extract<
    GameCommand["payload"],
    { type: "combat" | "use-skill" | "battle-action" }
  >,
  definition: WorldDefinition,
  emit: Emit,
): void {
  if (state.combat?.tactics && definition.campaign?.tactics) {
    resolveTacticalCommand(state, payload, definition, emit);
  } else if (payload.type === "battle-action") {
    throw new CommandError(
      "INVALID_COMMAND",
      "Hành động này cần bộ luật Argon.",
    );
  } else resolveLegacy(state, payload, definition, emit);
}

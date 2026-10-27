import { processCommand } from "../core/processor";
import { canAfford, supplyCosts } from "../core/resources";
import { createRng, nextInt } from "../core/rng";
import { createGame } from "../core/state";
import type { GameCommand } from "../core/commands";
import type { GameState } from "../core/state-schema";
import { availableRoutes } from "../world/travel";
import type { WorldDefinition } from "../world/schema";

export interface ScenarioResult {
  state: GameState;
  rejectedCommands: number;
  steps: number;
}

export function travelCommand(state: GameState, routeId: string): GameCommand {
  return {
    id: `command.${state.commandLog.length + 1}`,
    issuerId: state.player.id,
    payload: { type: "travel", convoyId: state.player.convoyId, routeId },
  };
}

export function waitCommand(state: GameState, ticks: number): GameCommand {
  return {
    id: `command.${state.commandLog.length + 1}`,
    issuerId: state.player.id,
    payload: { type: "wait", convoyId: state.player.convoyId, ticks },
  };
}

export function runRouteScenario(
  seed: number,
  routeIds: readonly string[],
  definition: WorldDefinition,
): ScenarioResult {
  let state = createGame(seed, definition);
  let steps = 0;
  for (const routeId of routeIds) {
    if (state.status !== "active") break;
    const result = processCommand(
      state,
      travelCommand(state, routeId),
      { principalId: state.player.id },
      definition,
    );
    steps += 1;
    if (!result.ok) return { state, rejectedCommands: 1, steps };
    state = result.state;
  }
  return { state, rejectedCommands: 0, steps };
}

/** Independent seeded bot RNG decides actions, never replacing or advancing the engine RNG. */
export function runSurvivalBot(
  seed: number,
  definition: WorldDefinition,
  policy: "wander" | "exhaustion",
): ScenarioResult {
  let state = createGame(seed, definition);
  let botRng = createRng((seed ^ 0xa5a5a5a5) >>> 0);
  let steps = 0;
  while (state.status === "active" && steps < 64) {
    const convoy = state.convoys[state.player.convoyId];
    if (!convoy) throw new Error("Missing convoy");
    const routes =
      policy === "wander"
        ? availableRoutes(state, convoy.id, definition).filter(
            (route) => route.affordable,
          )
        : [];
    let command: GameCommand;
    if (routes.length > 0) {
      const draw = nextInt(botRng, routes.length);
      botRng = draw.rng;
      const route = routes[draw.value];
      if (!route) throw new Error("Bot selected nonexistent route");
      command = travelCommand(state, route.routeId);
    } else {
      let ticks = 12;
      while (
        ticks > 0 &&
        !canAfford(
          convoy.resources,
          supplyCosts(state, convoy, ticks, definition),
        )
      )
        ticks -= 1;
      if (ticks === 0) break;
      command = waitCommand(state, ticks);
    }
    const result = processCommand(
      state,
      command,
      { principalId: state.player.id },
      definition,
    );
    steps += 1;
    if (!result.ok) return { state, rejectedCommands: 1, steps };
    state = result.state;
  }
  return { state, rejectedCommands: 0, steps };
}

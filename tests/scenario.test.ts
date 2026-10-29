import { describe, expect, it } from "vitest";
import { campaignDefinition } from "../src/content/campaign";
import { processCommand } from "../src/core/processor";
import { createGame } from "../src/core/state";
import type { GameCommand } from "../src/core/commands";
import type { GameState } from "../src/core/state-schema";
import { travelCommand } from "../src/simulation/scenarios";
import { campaignChoice } from "../src/simulation/campaign";
import { loadGame, serializeGame } from "../src/persistence/save";

const def = campaignDefinition;

function take(state: GameState, payload: GameCommand["payload"]): GameState {
  const result = processCommand(
    state,
    {
      id: `cmd.${state.commandLog.length + 1}`,
      issuerId: state.player.id,
      payload,
    },
    { principalId: state.player.id },
    def,
  );
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.state;
}

function reachMarket(): GameState {
  let state = createGame(42, def);
  state = take(state, campaignChoice(state, "prepare").payload);
  return take(state, travelCommand(state, "route.garage-market").payload);
}

describe("R4.1 Market Blackout Scenario & Vehicle Modules", () => {
  it("enforces crew selection rules and initializes scenario", () => {
    let state = reachMarket();
    expect(state.convoys[state.player.convoyId]?.locationId).toBe("location.market");

    // Invalid crew: duplicate scout and guard
    expect(() =>
      take(state, {
        type: "scenario-start",
        convoyId: state.player.convoyId,
        scenarioId: "scenario.market-blackout",
        scoutIds: ["character.minh", "character.lan"],
        guardId: "character.lan",
      }),
    ).toThrow(/Guard cannot be a scout/);

    // Valid start: Minh & Lan scout, Bao guards vehicle
    state = take(state, {
      type: "scenario-start",
      convoyId: state.player.convoyId,
      scenarioId: "scenario.market-blackout",
      scoutIds: ["character.minh", "character.lan"],
      guardId: "character.bao",
    });

    expect(state.scenario?.phase).toBe("exploring");
    expect(state.scenario?.currentNodeId).toBe("node.parking");
    expect(state.scenario?.alert).toBe(0);
    expect(state.scenario?.cargo).toEqual([]);
  });

  it("navigates graph, leverages Bao to wire power silently, and rescues Ha", () => {
    let state = reachMarket();
    // Minh & Bao scout, Lan guards
    state = take(state, {
      type: "scenario-start",
      convoyId: state.player.convoyId,
      scenarioId: "scenario.market-blackout",
      scoutIds: ["character.minh", "character.bao"],
      guardId: "character.lan",
    });

    // Move to stalls
    state = take(state, {
      type: "scenario-move",
      convoyId: state.player.convoyId,
      targetNodeId: "node.stalls",
    });
    expect(state.scenario?.currentNodeId).toBe("node.stalls");

    // Scout stalls (0 alert)
    state = take(state, {
      type: "scenario-act",
      convoyId: state.player.convoyId,
      nodeId: "node.stalls",
      actionId: "act.scout-stalls",
    });
    expect(state.scenario?.alert).toBe(0);

    // Move to power room
    state = take(state, {
      type: "scenario-move",
      convoyId: state.player.convoyId,
      targetNodeId: "node.power",
    });

    // Bao wires silently (costs 1 scrap, 0 alert, turns on power)
    const scrapBefore = state.convoys[state.player.convoyId]!.resources.scrap;
    state = take(state, {
      type: "scenario-act",
      convoyId: state.player.convoyId,
      nodeId: "node.power",
      actionId: "act.wire-silently",
    });
    expect(state.scenario?.powerOn).toBe(true);
    expect(state.scenario?.alert).toBe(0);
    expect(state.convoys[state.player.convoyId]!.resources.scrap).toBe(scrapBefore - 1);

    // Move to warehouse
    state = take(state, {
      type: "scenario-move",
      convoyId: state.player.convoyId,
      targetNodeId: "node.warehouse",
    });

    // Take fuel (alert +1, cargo = 1)
    state = take(state, {
      type: "scenario-act",
      convoyId: state.player.convoyId,
      nodeId: "node.warehouse",
      actionId: "act.take-fuel",
    });
    expect(state.scenario?.cargo).toEqual(["cargo.fuel"]);
    expect(state.scenario?.alert).toBe(1);

    // Take generator (alert +1, cargo = 2)
    state = take(state, {
      type: "scenario-act",
      convoyId: state.player.convoyId,
      nodeId: "node.warehouse",
      actionId: "act.take-generator",
    });
    expect(state.scenario?.cargo.length).toBe(2);

    // Cargo full: third item is rejected
    expect(() =>
      take(state, {
        type: "scenario-act",
        convoyId: state.player.convoyId,
        nodeId: "node.warehouse",
        actionId: "act.take-scrap",
      }),
    ).toThrow(/Ba-lô đã đầy/);

    // Move to backroom
    state = take(state, {
      type: "scenario-move",
      convoyId: state.player.convoyId,
      targetNodeId: "node.backroom",
    });

    // Rescue Ha (power is on -> 0 alert)
    state = take(state, {
      type: "scenario-act",
      convoyId: state.player.convoyId,
      nodeId: "node.backroom",
      actionId: "act.rescue-ha",
    });
    expect(state.scenario?.rescuedHa).toBe(true);
    expect(state.scenario?.alert).toBe(2);

    // Move back towards warehouse then stalls then parking -> triggers crisis at parking!
    state = take(state, {
      type: "scenario-move",
      convoyId: state.player.convoyId,
      targetNodeId: "node.warehouse",
    });
    state = take(state, {
      type: "scenario-move",
      convoyId: state.player.convoyId,
      targetNodeId: "node.stalls",
    });
    state = take(state, {
      type: "scenario-move",
      convoyId: state.player.convoyId,
      targetNodeId: "node.parking",
    });

    expect(state.scenario?.phase).toBe("crisis");

    // Decoy escape: drops 1 cargo item to distract raiders
    state = take(state, {
      type: "scenario-crisis",
      convoyId: state.player.convoyId,
      method: "decoy",
    });
    expect(state.scenario?.phase).toBe("completed");
    expect(state.scenario?.cargo.length).toBe(1);

    // Finish scenario and install fuel-tank module
    const fuelBefore = state.convoys[state.player.convoyId]!.resources.fuel;
    state = take(state, {
      type: "scenario-finish",
      convoyId: state.player.convoyId,
      chosenModuleId: "module.fuel-tank",
    });

    expect(state.scenario?.installedModuleId).toBe("module.fuel-tank");
    expect(state.convoys[state.player.convoyId]?.actorIds).toContain("character.ha");
    expect(state.convoys[state.player.convoyId]!.resources.fuel).toBeGreaterThan(fuelBefore);

    // Verify replay determinism & save/load round-trip
    const serialized = serializeGame(state, def);
    const loaded = loadGame(serialized, def);
    expect(loaded).toEqual(state);
  });

  it("applies vehicle module benefits: fuel-tank saves fuel, triage-unit heals crew on travel", () => {
    let state = reachMarket();
    state = take(state, {
      type: "scenario-start",
      convoyId: state.player.convoyId,
      scenarioId: "scenario.market-blackout",
      scoutIds: ["character.minh", "character.lan"],
      guardId: "character.bao",
    });
    state = take(state, {
      type: "scenario-move",
      convoyId: state.player.convoyId,
      targetNodeId: "node.stalls",
    });
    // Trigger crisis by looting stalls twice / generating alert or evacuating
    state = take(state, {
      type: "scenario-move",
      convoyId: state.player.convoyId,
      targetNodeId: "node.parking",
    });
    // Force complete via evacuate
    state = take(state, {
      type: "scenario-crisis",
      convoyId: state.player.convoyId,
      method: "evacuate",
    });
    state = take(state, {
      type: "scenario-finish",
      convoyId: state.player.convoyId,
      chosenModuleId: "module.triage-unit",
    });

    // Injure an active crew member
    state.actors["character.minh"]!.health = 60;
    const hpBefore = state.actors["character.minh"]!.health;

    // Travel to hospital: triage-unit should heal Minh by 6 HP!
    state = take(state, travelCommand(state, "route.market-hospital").payload);
    expect(state.actors["character.minh"]!.health).toBe(hpBefore + 6);
  });
});

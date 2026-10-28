import { describe, expect, it } from "vitest";
import fixtures from "./fixtures/v01-saves.json";
import { campaignDefinition as def } from "../src/content/campaign";
import { legacyCampaignDefinition as legacy } from "../src/content/registry";
import { processCommand } from "../src/core/processor";
import type { GameCommand } from "../src/core/commands";
import type { GameState } from "../src/core/state-schema";
import { createGame } from "../src/core/state";
import { replayLog } from "../src/core/replay";
import { loadGame, serializeGame } from "../src/persistence/save";
import { loadCompatibleSlot } from "../src/persistence/compatible";
import { LocalSaveStore } from "../src/persistence/local-storage";
import { campaignChoice, playCampaign } from "../src/simulation/campaign";
import { travelCommand, waitCommand } from "../src/simulation/scenarios";
import { planTravel } from "../src/world/travel";
import { damageRange } from "../src/combat/actions";
import { currentCombatActor } from "../src/combat/engine";
import { summarizeTransition } from "../src/read-models/transition";
import { skillView } from "../src/read-models/skills";
import { validateWorldDefinition } from "../src/world/registry";
import { conditionDescription } from "../src/narrative/read-model";

function command(
  state: GameState,
  payload: GameCommand["payload"],
): GameCommand {
  return {
    id: `command.${state.commandLog.length + 1}`,
    issuerId: state.player.id,
    payload,
  };
}
function take(
  state: GameState,
  payload: GameCommand["payload"],
  definition = def,
) {
  const c = command(state, payload);
  const result = processCommand(
    state,
    c,
    { principalId: state.player.id },
    definition,
  );
  if (!result.ok)
    throw new Error(`${result.error.code}: ${result.error.message}`);
  return result;
}
function hospital() {
  let state = createGame(42, def);
  state = take(state, campaignChoice(state, "prepare").payload).state;
  state = take(
    state,
    travelCommand(state, "route.garage-market").payload,
  ).state;
  return take(state, travelCommand(state, "route.market-hospital").payload)
    .state;
}

describe("R1 actions and tactical customization", () => {
  it("explains the missing ownership condition without claiming a known rule is missing", () => {
    const state = createGame(42, def);
    const reason = conditionDescription(
      {
        op: "all",
        conditions: [
          { op: "at", locationId: "location.garage" },
          {
            op: "owns",
            artifactId: "artifact.mirror",
            ownerId: "location.garage",
          },
        ],
      },
      def,
      state,
    );
    expect(reason).toBe("Mắt gương phải còn ở Gara cuối phố");
  });
  it("scouting grants one cache/XP and halves real route risk", () => {
    const state = createGame(42, def);
    const beforeRisk = planTravel(
      state,
      state.player.convoyId,
      "route.garage-market",
      def,
    ).riskBps;
    const result = take(state, {
      type: "investigate",
      convoyId: state.player.convoyId,
    });
    const next = result.state;
    expect(next.world.tick).toBe(1);
    expect(next.convoys[next.player.convoyId]!.resources.fuel).toBe(
      state.convoys[state.player.convoyId]!.resources.fuel + 2,
    );
    expect(next.actors["character.minh"]!.progression?.xp).toBe(3);
    expect(
      planTravel(next, next.player.convoyId, "route.garage-market", def)
        .riskBps,
    ).toBe(Math.floor(beforeRisk / 2));
    const denied = processCommand(
      next,
      command(next, { type: "investigate", convoyId: next.player.convoyId }),
      { principalId: next.player.id },
      def,
    );
    expect(denied.ok).toBe(false);
    expect(denied.state).toBe(next);
  });
  it("expired intel can refresh without farming cache or XP", () => {
    let state = createGame(42, def);
    state = take(state, {
      type: "investigate",
      convoyId: state.player.convoyId,
    }).state;
    state = take(state, waitCommand(state, 6).payload).state;
    const fuel = state.convoys[state.player.convoyId]!.resources.fuel;
    state = take(state, {
      type: "investigate",
      convoyId: state.player.convoyId,
    }).state;
    expect(state.convoys[state.player.convoyId]!.resources.fuel).toBe(fuel);
    expect(state.actors["character.minh"]!.progression?.xp).toBe(3);
    expect(
      state.commandLog
        .at(-1)
        ?.events.some(
          (event) =>
            event.payload.type === "expedition.scouted" &&
            !event.payload.firstVisit,
        ),
    ).toBe(true);
  });
  it("rest heals injured active crew, restores energy and consumes supplies", () => {
    let state = hospital();
    state = take(state, campaignChoice(state, "ignore-bell").payload).state;
    state = take(state, {
      type: "use-skill",
      convoyId: state.player.convoyId,
      actorId: "character.lan",
      skillId: "skill.sense",
    }).state;
    const before = state;
    state = take(state, waitCommand(state, 1).payload).state;
    expect(state.actors["character.minh"]!.health).toBe(
      before.actors["character.minh"]!.health + 5,
    );
    expect(state.actors["character.lan"]!.energy).toBe(6);
    expect(state.convoys[state.player.convoyId]!.resources.food).toBe(
      before.convoys[state.player.convoyId]!.resources.food - 3,
    );
    expect(loadGame(serializeGame(state, def), def)).toEqual(state);
  });
  it("repair costs scrap, restores condition and rejects needless repair", () => {
    const custom = structuredClone(def);
    custom.routes[0]!.risk = { chanceBps: 10000, minDamage: 20, maxDamage: 20 };
    let state = createGame(42, custom);
    state = take(
      state,
      travelCommand(state, "route.garage-market").payload,
      custom,
    ).state;
    const before = state;
    state = take(
      state,
      { type: "repair", convoyId: state.player.convoyId },
      custom,
    ).state;
    expect(state.convoys[state.player.convoyId]!.vehicle.condition).toBe(98);
    expect(state.convoys[state.player.convoyId]!.resources.scrap).toBe(
      before.convoys[state.player.convoyId]!.resources.scrap - 2,
    );
    const initial = createGame(0, def);
    const rejected = processCommand(
      initial,
      command(initial, { type: "repair", convoyId: initial.player.convoyId }),
      { principalId: initial.player.id },
      def,
    );
    expect(rejected.ok).toBe(false);
    expect(rejected.state).toBe(initial);
  });
  it("spends training points and changes real combat damage without advancing time", () => {
    let state = createGame(42, def);
    const original = state;
    state = take(state, {
      type: "train-actor",
      convoyId: state.player.convoyId,
      actorId: "character.minh",
      upgradeId: "training.power",
    }).state;
    expect(state.world.tick).toBe(0);
    expect(state.rng).toEqual(original.rng);
    expect(state.actors["character.minh"]!.attributes!.attack).toBe(16);
    expect(state.actors["character.minh"]!.progression?.points).toBe(0);
    const before = damageRange(
      state,
      "character.minh",
      "character.hunger",
      0,
      def,
    );
    state = take(state, {
      type: "set-stance",
      convoyId: state.player.convoyId,
      actorId: "character.minh",
      stanceId: "stance.assault",
    }).state;
    expect(
      damageRange(state, "character.minh", "character.hunger", 0, def)[0],
    ).toBe(before[0] + 3);
    expect(loadGame(serializeGame(state, def), def)).toEqual(state);
    const denied = processCommand(
      state,
      command(state, {
        type: "train-actor",
        convoyId: state.player.convoyId,
        actorId: "character.minh",
        upgradeId: "training.power",
      }),
      { principalId: state.player.id },
      def,
    );
    expect(denied.ok).toBe(false);
    expect(denied.state).toBe(state);
  });
  it("training health/energy modifies the maxima and remains replayable", () => {
    for (const upgradeId of ["training.endurance", "training.focus"]) {
      const initial = createGame(0, def);
      const state = take(initial, {
        type: "train-actor",
        convoyId: initial.player.convoyId,
        actorId: "character.lan",
        upgradeId,
      }).state;
      expect(
        upgradeId === "training.endurance"
          ? state.actors["character.lan"]!.maxHealth
          : state.actors["character.lan"]!.attributes!.maxEnergy,
      ).toBe(upgradeId === "training.endurance" ? 92 : 8);
      expect(replayLog(0, state.commandLog, def)).toEqual(state);
    }
  });
  it("heals outside combat with a real cost and refuses full-health no-ops", () => {
    let state = hospital();
    state = take(state, campaignChoice(state, "ignore-bell").payload).state;
    const before = state;
    const payload = {
      type: "use-skill",
      convoyId: state.player.convoyId,
      actorId: "character.lan",
      skillId: "skill.heal",
      targetId: "character.minh",
    } as const;
    state = take(state, payload).state;
    expect(state.actors["character.minh"]!.health).toBe(100);
    expect(state.convoys[state.player.convoyId]!.resources.medicine).toBe(
      before.convoys[state.player.convoyId]!.resources.medicine - 1,
    );
    expect(
      skillView(state, "character.lan", "skill.heal", "character.minh", def)
        .enabled,
    ).toBe(false);
  });
  it("early combat pays loot and XP but does not resolve the main rival", () => {
    const run = playCampaign(42, "combat", def);
    expect(run.issue).toBe(null);
    expect(run.state.status).toBe("won");
    const index = run.state.commandLog.findIndex((record) =>
      record.events.some(
        (event) =>
          event.payload.type === "combat.victory" &&
          event.payload.enemyConvoyId === "convoy.scavengers",
      ),
    );
    expect(index).toBeGreaterThan(0);
    const state = replayLog(42, run.state.commandLog.slice(0, index + 1), def);
    expect(state.combat?.phase).toBe("aftermath");
    expect(state.world.facts["cache.secured"]?.value).toBe(true);
    expect(state.world.facts["rival.resolved"]?.value).not.toBe(true);
    expect(state.actors["character.minh"]!.progression!.points).toBe(2);
    const reward = state.commandLog
      .at(-1)!
      .events.find((event) => event.payload.type === "combat.victory")?.payload;
    expect(reward?.type === "combat.victory" && reward.rewards.food).toBe(9);
    expect(currentCombatActor(state)?.convoyId).toBe(state.player.convoyId);
  });
  it.each(["attack", "skill"] as const)(
    "rejects a remote rival target during the market battle: %s",
    (action) => {
      let state = createGame(42, def);
      state = take(
        state,
        travelCommand(state, "route.garage-market").payload,
      ).state;
      state = take(state, campaignChoice(state, "leave-ha").payload).state;
      state = take(state, campaignChoice(state, "raid-cache").payload).state;
      const common = {
        convoyId: state.player.convoyId,
        actorId: "character.minh",
        targetId: "character.raven",
      };
      const payload: GameCommand["payload"] =
        action === "attack"
          ? { ...common, type: "combat", action: "attack" }
          : { ...common, type: "use-skill", skillId: "skill.strike" };
      const result = processCommand(
        state,
        command(state, payload),
        { principalId: state.player.id },
        def,
      );
      expect(result.ok).toBe(false);
      expect(result.state).toBe(state);
      expect(result.events).toEqual([]);
      expect(
        skillView(
          state,
          "character.minh",
          "skill.strike",
          "character.raven",
          def,
        ).enabled,
      ).toBe(false);
    },
  );
  it("reports actual costs, rewards and consequences from state deltas", () => {
    const before = createGame(42, def);
    const c = command(before, {
      type: "investigate",
      convoyId: before.player.convoyId,
    });
    const result = take(before, c.payload);
    const report = summarizeTransition(
      before,
      result.state,
      c,
      result.events,
      def,
    );
    expect(report.costs.food).toBe(3);
    expect(report.gains.fuel).toBe(2);
    expect(report.net.food).toBe(-3);
    expect(report.crew[0]!.xp).toBe(3);
    expect(report.discoveries.length).toBeGreaterThan(0);
  });
  it("validates recon refs and shared encounter actors", () => {
    const a = structuredClone(def);
    a.campaign!.operations!.recon[0]!.factIds = ["missing.fact"];
    expect(() => validateWorldDefinition(a)).toThrow();
    const b = structuredClone(def);
    b.campaign!.encounters![0]!.characterIds = ["character.minh"];
    expect(() => validateWorldDefinition(b)).toThrow();
    const c = structuredClone(def);
    c.campaign!.encounters!.push({
      ...c.campaign!.encounters![0]!,
      id: "encounter.duplicate-convoy",
      characterIds: ["character.ha"],
    });
    expect(() => validateWorldDefinition(c)).toThrow(
      /Duplicate encounter convoy ID/,
    );
  });
});

describe("genuine v0.1 saves stay playable", () => {
  it.each(["mid", "completed", "waited"] as const)(
    "loads and replays %s from Git 8f987d7 without altering the snapshot",
    (key) => {
      const state = loadGame(fixtures[key], legacy);
      expect(state).toEqual(JSON.parse(fixtures[key]).state);
      expect(state.campaign?.operations).toBeUndefined();
      expect(state.actors["character.minh"]?.progression).toBeUndefined();
      expect(replayLog(state.initialSeed, state.commandLog, legacy)).toEqual(
        state,
      );
    },
  );
  it("separate slots preserve old bytes and choose the matching rules", () => {
    const map = new Map<string, string>();
    const storage = {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => {
        map.set(key, value);
      },
      removeItem: (key: string) => {
        map.delete(key);
      },
    };
    storage.setItem("last-convoy:slot:manual", fixtures.mid);
    expect(
      loadCompatibleSlot(storage, "manual").definition.contentVersion,
    ).toBe(legacy.contentVersion);
    new LocalSaveStore(storage, def).save("r1-manual", createGame(42, def));
    expect(storage.getItem("last-convoy:slot:manual")).toBe(fixtures.mid);
    expect(
      loadCompatibleSlot(storage, "manual").definition.contentVersion,
    ).toBe(def.contentVersion);
    expect(
      loadCompatibleSlot(storage, "manual", true).definition.contentVersion,
    ).toBe(legacy.contentVersion);
    storage.setItem("last-convoy:slot:r1-manual", "invalid-json");
    expect(() => loadCompatibleSlot(storage, "manual")).toThrow();
  });
});

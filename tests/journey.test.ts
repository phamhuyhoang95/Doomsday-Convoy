import { describe, expect, it } from "vitest";
import { journeyDefinition as def } from "../src/content/journey";
import { argonDefinition } from "../src/content/argon";
import { getContentDefinition } from "../src/content/registry";
import { createGame } from "../src/core/state";
import { processCommand } from "../src/core/processor";
import type { GameState } from "../src/core/state-schema";
import type { GameCommand } from "../src/core/commands";
import { loadGame, serializeGame } from "../src/persistence/save";
import { autoCombatAction } from "../src/read-models/auto-combat";
import { choiceAvailability } from "../src/narrative/read-model";
import { currentCombatActor } from "../src/combat/engine";

const run = (s: GameState, payload: GameCommand["payload"]) =>
  processCommand(
    s,
    {
      id: `command.${s.commandLog.length + 1}`,
      issuerId: s.player.id,
      payload,
    },
    { principalId: s.player.id },
    def,
  );
function take(s: GameState, p: GameCommand["payload"]) {
  const r = run(s, p);
  if (!r.ok) throw new Error(r.error.message);
  return r.state;
}
const choose = (s: GameState, choiceId: string) =>
  take(s, {
    type: "choose",
    convoyId: s.player.convoyId,
    instanceId: s.activeEvents[0]!.instanceId,
    choiceId,
  });
const travel = (s: GameState, routeId: string) =>
  take(s, { type: "travel", convoyId: s.player.convoyId, routeId });
function market(radio = "radio-scan") {
  let s = createGame(42, def);
  s = choose(s, "prepare");
  s = choose(s, radio);
  s = travel(s, "route.garage-market");
  return choose(s, "leave-ha");
}
function reachCheckpoint(s: GameState) {
  s = choose(s, "take-lantern");
  s = choose(s, "listen-stranger");
  s = travel(s, "route.service-hospital");
  s = choose(s, "listen");
  s = choose(s, "read-records");
  s = travel(s, "route.hospital-ward");
  s = choose(s, "treat-patient");
  s = choose(s, "seal-ward");
  return travel(s, "route.ward-checkpoint");
}
describe("Journey choices", () => {
  it("turns the earlier recording into a way to investigate without spending medicine", () => {
    let s = market();
    const medicine = s.convoys[s.player.convoyId]!.resources.medicine;
    s = choose(s, "water-verify");
    expect(s.knowledge.factIds).toContain("journey.water-inspected");
    expect(s.convoys[s.player.convoyId]!.resources.medicine).toBe(medicine);
    s = choose(s, "water-purify");
    expect(s.world.facts["journey.water-clean"]?.value).toBe(true);
    expect(loadGame(serializeGame(s, def), def)).toEqual(s);
  });
  it("preserves the O1 bundle and replays both generations", () => {
    expect(def.contentVersion).not.toBe(argonDefinition.contentVersion);
    expect(getContentDefinition(argonDefinition.contentVersion)).toBe(
      argonDefinition,
    );
    const old = createGame(42, argonDefinition);
    expect(
      loadGame(serializeGame(old, argonDefinition), argonDefinition),
    ).toEqual(old);
    expect(argonDefinition.campaign?.events).toHaveLength(12);
    expect(def.campaign?.events).toHaveLength(16);
  });
  it("makes inspection reveal information and reopen a materially different decision", () => {
    let s = market();
    expect(s.activeEvents[0]?.eventId).toBe("event.journey-water");
    const purify = def
      .campaign!.events.find((e) => e.id === "event.journey-water")!
      .choices.find((c) => c.id === "water-purify")!;
    expect(choiceAvailability(s, purify, def).reason).not.toContain("sợi đen");
    const fuel = s.convoys[s.player.convoyId]!.resources.fuel;
    const blocked = run(s, {
      type: "choose",
      convoyId: s.player.convoyId,
      instanceId: s.activeEvents[0]!.instanceId,
      choiceId: "water-purify",
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.state).toBe(s);
    expect(blocked.events).toEqual([]);
    s = choose(s, "water-inspect");
    expect(s.knowledge.factIds).toContain("journey.water-inspected");
    expect(s.activeEvents[0]?.eventId).toBe("event.journey-water");
    s = choose(s, "water-purify");
    expect(s.convoys[s.player.convoyId]!.resources.fuel).toBe(fuel - 2);
    s = travel(s, "route.market-service");
    expect(s.activeEvents[0]?.eventId).not.toBe(
      "event.journey-water-aftermath",
    );
    s = reachCheckpoint(s);
    expect(s.activeEvents[0]?.eventId).toBe("event.journey-contact");
    s = choose(s, "contact-share");
    expect(s.world.facts["journey.contact-settled"]?.value).toBe(true);
    expect(s.knowledge.factIds).toContain("rival.motive");
    expect(loadGame(serializeGame(s, def), def)).toEqual(s);
  });
  it("delays the raw-water problem until the next stop, blocks evasion and keeps a free fallback", () => {
    let s = market("radio-answer");
    s = choose(s, "water-accept");
    expect(s.activeEvents[0]?.eventId).not.toBe(
      "event.journey-water-aftermath",
    );
    s = travel(s, "route.market-service");
    expect(s.activeEvents[0]?.eventId).toBe("event.journey-water-aftermath");
    const rejected = run(s, {
      type: "travel",
      convoyId: s.player.convoyId,
      routeId: "route.service-hospital",
    });
    expect(rejected.ok).toBe(false);
    expect(rejected.state).toBe(s);
    expect(rejected.events).toEqual([]);
    const health = s.actors["character.minh"]!.health;
    s = choose(s, "water-endure");
    expect(s.actors["character.minh"]!.health).toBe(health - 12);
    expect(s.world.facts["journey.water-resolved"]?.value).toBe(true);
    s = travel(s, "route.service-hospital");
    expect(s.convoys[s.player.convoyId]!.locationId).toBe("location.hospital");
    expect(loadGame(serializeGame(s, def), def)).toEqual(s);
  });
  it("does not require the radio/water arc for a campaign route", () => {
    let s = createGame(42, def);
    s = choose(s, "prepare");
    s = choose(s, "radio-ignore");
    s = travel(s, "route.garage-market");
    s = choose(s, "leave-ha");
    expect(s.activeEvents[0]?.eventId).toBe("event.market-cache");
    s = travel(s, "route.market-service");
    expect(s.activeEvents[0]?.eventId).toBe("event.service-depot");
  });
});
function battle(seed: number) {
  let s = createGame(seed, def);
  s = choose(s, "prepare");
  s = travel(s, "route.garage-market");
  s = choose(s, "leave-ha");
  return choose(s, "raid-cache");
}
describe("Auto combat suggestions", () => {
  it.each([1, 42, 103])(
    "plays accepted commands through seed %i and stops before aftermath decisions",
    (seed) => {
      let s = battle(seed);
      const tick = s.world.tick;
      for (let i = 0; s.combat?.phase === "active" && i < 90; i++) {
        const snapshot = structuredClone(s);
        const payload = autoCombatAction(s, def);
        expect(payload).not.toBeNull();
        expect(s).toEqual(snapshot);
        expect(payload?.type).toBe("battle-action");
        s = take(s, payload!);
      }
      expect(s.combat?.phase).toBe("aftermath");
      expect(autoCombatAction(s, def)).toBeNull();
      expect(s.world.tick).toBe(tick);
      expect(Object.values(s.actors).some((a) => a.status === "captured")).toBe(
        false,
      );
      expect(loadGame(serializeGame(s, def), def)).toEqual(s);
    },
  );
  it("prioritizes an actual revive and never spends an artifact or fuel automatically", () => {
    let s = battle(42);
    s = take(s, {
      type: "battle-action",
      action: "guard",
      convoyId: s.player.convoyId,
      actorId: currentCombatActor(s)!.id,
    });
    s.actors["character.bao"]!.health = 0;
    s.actors["character.bao"]!.status = "downed";
    const payload = autoCombatAction(s, def);
    expect(payload).toMatchObject({
      action: "ability",
      abilityId: "skill.heal",
      targetId: "character.bao",
    });
    const fuel = s.convoys[s.player.convoyId]!.resources.fuel;
    s = take(s, payload!);
    expect(s.actors["character.bao"]!.health).toBeGreaterThan(0);
    expect(s.convoys[s.player.convoyId]!.resources.fuel).toBe(fuel);
  });
});

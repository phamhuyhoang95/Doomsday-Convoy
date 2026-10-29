import { describe, expect, it } from "vitest";
import { resonanceDefinition as def } from "../src/content/resonance";
import { journeyDefinition } from "../src/content/journey";
import { createGame } from "../src/core/state";
import { processCommand } from "../src/core/processor";
import type { GameState } from "../src/core/state-schema";
import type { GameCommand } from "../src/core/commands";
import { loadGame, serializeGame } from "../src/persistence/save";
import { currentCombatActor } from "../src/combat/engine";
import { ascensionPreview } from "../src/occult/progression";
import { planTravel } from "../src/world/travel";
import {
  discoveredRecords,
  chapterProgress,
} from "../src/read-models/campaign";
import { tacticalDamageRange } from "../src/combat/tactical-engine";
import { autoCombatAction } from "../src/read-models/auto-combat";
const run = (s: GameState, p: GameCommand["payload"]) =>
  processCommand(
    s,
    {
      id: `command.${s.commandLog.length + 1}`,
      issuerId: s.player.id,
      payload: p,
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
const ascend = (
  s: GameState,
  id = "character.minh",
  pathwayId = "path.mirror-walker",
) =>
  take(s, {
    type: "ascend-pathway",
    convoyId: s.player.convoyId,
    actorId: id,
    pathwayId,
  });
function ready() {
  let s = createGame(42, def);
  s = choose(s, "prepare");
  s = choose(s, "radio-ignore");
  return choose(s, "study-awakening");
}
function battle() {
  let s = ready();
  s = travel(s, "route.garage-market");
  s = choose(s, "leave-ha");
  return choose(s, "raid-cache");
}
function act(s: GameState, abilityId: string, targetId?: string) {
  return take(s, {
    type: "battle-action",
    convoyId: s.player.convoyId,
    actorId: currentCombatActor(s)!.id,
    action: "ability",
    abilityId,
    ...(targetId ? { targetId } : {}),
  });
}
/** Crafted state fixture for individual combat operators; integration/replay tests use real commands below. */
function empowered(pathwayId: string, tier: 7 | 8 | 9 = 7) {
  const s = battle();
  const a = s.actors["character.minh"]!;
  const path = def.campaign!.resonance!.pathways.find(
    (p) => p.id === pathwayId,
  )!;
  a.progression!.xp = 100;
  a.progression!.points = 11;
  a.pathway = {
    pathwayId,
    tier,
    spentXp: path.tiers
      .filter((t) => t.tier >= tier)
      .reduce((n, t) => n + t.xpCost, 0),
  };
  a.skillIds = [
    ...(a.skillIds ?? []),
    ...path.tiers.filter((t) => t.tier >= tier).map((t) => t.skillId),
  ];
  return s;
}
describe("Resonance lore and ascension", () => {
  it("keeps Journey unchanged, hides unknown records and requires the safety note before leaving", () => {
    expect(journeyDefinition.campaign?.resonance).toBeUndefined();
    let s = createGame(42, def);
    expect(
      discoveredRecords(s, def).every((r) => !r.known && r.record === null),
    ).toBe(true);
    s = choose(s, "prepare");
    const r = run(s, {
      type: "travel",
      convoyId: s.player.convoyId,
      routeId: "route.garage-market",
    });
    expect(r.ok).toBe(false);
    expect(r.state).toBe(s);
    expect(r.events).toEqual([]);
  });
  it("awakens any active crew member, spends a shared remnant and keeps cumulative XP/points intact", () => {
    let s = ready();
    const before = s;
    const actor = s.actors["character.bao"]!;
    const tick = s.world.tick,
      xp = actor.progression!.xp,
      points = actor.progression!.points;
    s = ascend(s, actor.id, "path.flesh-stitcher");
    expect(s.actors[actor.id]!.skillIds).toContain("skill.red-suture");
    expect(s.actors[actor.id]!.progression!.xp).toBe(xp);
    expect(s.actors[actor.id]!.progression!.points).toBe(points);
    expect(s.campaign!.occultRemnants).toBe(2);
    expect(s.world.tick).toBe(tick);
    expect(before.actors[actor.id]!.pathway).toBeUndefined();
    expect(loadGame(serializeGame(s, def), def)).toEqual(s);
    expect(ascensionPreview(s, actor.id, "path.bell-medium", def).enabled).toBe(
      false,
    );
  });
  it("rejects missing knowledge, insufficient resources and rival ownership without mutation", () => {
    const start = createGame(42, def);
    for (const s of [start, ready()]) {
      const p = {
        type: "ascend-pathway" as const,
        convoyId: s.player.convoyId,
        actorId: s === start ? "character.minh" : "character.raven",
        pathwayId: "path.bell-medium",
      };
      const r = run(s, p);
      expect(r.ok).toBe(false);
      expect(r.state).toBe(s);
      expect(r.events).toEqual([]);
    }
    const s = ready();
    s.convoys[s.player.convoyId]!.resources.medicine = 0;
    const r = run(s, {
      type: "ascend-pathway",
      convoyId: s.player.convoyId,
      actorId: "character.minh",
      pathwayId: "path.flesh-stitcher",
    });
    expect(r.ok).toBe(false);
    expect(r.state).toBe(s);
  });
  it("makes bell risk reduction real and does not stack across duplicated practitioners", () => {
    let s = ready();
    const before = planTravel(
      s,
      s.player.convoyId,
      "route.garage-market",
      def,
    ).riskBps;
    s = ascend(s, "character.minh", "path.bell-medium");
    const after = planTravel(
      s,
      s.player.convoyId,
      "route.garage-market",
      def,
    ).riskBps;
    expect(after).toBe(Math.floor(before * 0.25));
    s = ascend(s, "character.lan", "path.bell-medium");
    expect(
      planTravel(s, s.player.convoyId, "route.garage-market", def).riskBps,
    ).toBe(after);
    expect(loadGame(serializeGame(s, def), def)).toEqual(s);
  });
  it("reaches tier 7 through actual investigations, preserves chapter progress and replays", () => {
    let s = ready();
    s = ascend(s, "character.minh", "path.bell-medium");
    s = travel(s, "route.garage-market");
    s = choose(s, "leave-ha");
    s = choose(s, "leave-cache");
    s = travel(s, "route.market-service");
    s = choose(s, "take-lantern");
    s = choose(s, "listen-stranger");
    s = choose(s, "read-carrier");
    s = travel(s, "route.service-hospital");
    s = choose(s, "listen");
    s = choose(s, "hear-hospital");
    s = ascend(s, "character.minh", "path.bell-medium");
    expect(s.actors["character.minh"]!.pathway?.tier).toBe(8);
    s = choose(s, "read-records");
    s = travel(s, "route.hospital-ward");
    s = choose(s, "treat-patient");
    s = choose(s, "read-mirror-witness");
    s = choose(s, "seal-ward");
    s = travel(s, "route.ward-checkpoint");
    s = choose(s, "read-zero-archive");
    s = ascend(s, "character.minh", "path.bell-medium");
    expect(s.actors["character.minh"]!.pathway?.tier).toBe(7);
    expect(s.actors["character.minh"]!.pathway?.spentXp).toBe(80);
    expect(chapterProgress(s, def).find((c) => c.current)?.id).toBe(
      "chapter.refuge",
    );
    expect(discoveredRecords(s, def).filter((r) => r.known)).toHaveLength(5);
    expect(loadGame(serializeGame(s, def), def)).toEqual(s);
  });
});
describe("Occult combat operators", () => {
  it("swaps real positions, restores energy and consumes the turn", () => {
    let s = empowered("path.mirror-walker", 9);
    const slot = s.combat!.tactics!.positions["character.lan"];
    s.actors["character.minh"]!.energy = 1;
    s = act(s, "skill.mirror-step", "character.lan");
    expect(s.combat!.tactics!.positions["character.minh"]).toBe(slot);
    expect(s.actors["character.minh"]!.energy).toBe(4);
    expect(currentCombatActor(s)?.id).not.toBe("character.minh");
  });
  it("gives a glass strike its exact 48 combo damage", () => {
    let s = empowered("path.mirror-walker", 8);
    s.combat!.tactics!.statuses.push({
      actorId: "character.hunger",
      sourceId: "character.minh",
      kind: "armor-broken",
      remainingTurns: 2,
      potency: 4,
    });
    const hp = s.actors["character.hunger"]!.health;
    s = act(s, "skill.glass-sever", "character.hunger");
    expect(s.actors["character.hunger"]!.health).toBe(hp - 48);
  });
  it("makes graft absorb damage and reflect once without recursion or lethal casting cost", () => {
    let s = empowered("path.flesh-stitcher", 8);
    s.actors["character.minh"]!.health = 20;
    s.actors["character.bao"]!.health = 80;
    const enemy = s.actors["character.hunger"]!.health;
    s = act(s, "skill.flesh-graft");
    expect(s.actors["character.minh"]!.health).toBe(12);
    expect(s.actors["character.hunger"]!.health).toBeLessThan(enemy);
    const low = empowered("path.flesh-stitcher", 8);
    low.actors["character.minh"]!.health = 8;
    const r = run(low, {
      type: "battle-action",
      convoyId: low.player.convoyId,
      actorId: "character.minh",
      action: "ability",
      abilityId: "skill.flesh-graft",
    });
    expect(r.ok).toBe(false);
    expect(r.state).toBe(low);
  });
  it("requires a corpse, consumes it permanently and damages the remaining enemy", () => {
    let s = empowered("path.flesh-stitcher");
    const rejected = run(s, {
      type: "battle-action",
      convoyId: s.player.convoyId,
      actorId: "character.minh",
      action: "ability",
      abilityId: "skill.corpse-puppeteer",
      targetId: "character.watcher",
    });
    expect(rejected.ok).toBe(false);
    expect(rejected.state).toBe(s);
    s.actors["character.hunger"]!.health = 0;
    s.actors["character.hunger"]!.status = "downed";
    const hp = s.actors["character.watcher"]!.health;
    s = act(s, "skill.corpse-puppeteer", "character.watcher");
    expect(s.actors["character.hunger"]!.status).toBe("dead");
    expect(s.actors["character.watcher"]!.health).toBe(hp - 35);
  });
  it("repairs the vehicle and hits both front enemies through the same action", () => {
    let s = empowered("path.rust-artificer", 8);
    s.convoys[s.player.convoyId]!.vehicle.condition = 60;
    s = act(s, "skill.blood-engine");
    expect(s.convoys[s.player.convoyId]!.vehicle.condition).toBe(75);
    expect(s.actors["character.hunger"]!.health).toBe(30);
    expect(s.actors["character.watcher"]!.health).toBe(24);
    expect(s.actors["character.minh"]!.health).toBe(94);
  });
  it("allows a repair-and-attack ability at full vehicle health while ordinary repair remains unavailable", () => {
    let s = empowered("path.rust-artificer", 8);
    const basic = run(s, {
      type: "battle-action",
      convoyId: s.player.convoyId,
      actorId: "character.minh",
      action: "ability",
      abilityId: def.campaign!.tactics!.abilities.find(
        (a) => a.source === "vehicle" && a.effect === "repair",
      )!.id,
    });
    expect(basic.ok).toBe(false);
    s = act(s, "skill.blood-engine");
    expect(s.convoys[s.player.convoyId]!.vehicle.condition).toBe(100);
    expect(s.actors["character.hunger"]!.health).toBe(30);
  });
  it("starts a finite fortress ward and emits real vehicle support damage", () => {
    let s = empowered("path.rust-artificer");
    s = act(s, "skill.living-fortress");
    expect(s.combat!.tactics!.vehicleWard?.expiresRound).toBe(3);
    expect(s.actors["character.hunger"]!.health).toBe(33);
    expect(
      s.commandLog
        .at(-1)!
        .events.some(
          (e) =>
            e.payload.type === "battle.beat" &&
            e.payload.actorId === s.convoys[s.player.convoyId]!.vehicle.id,
        ),
    ).toBe(true);
  });
  it("inverts an enemy hit into healing without losing authoritative health", () => {
    let s = empowered("path.mirror-walker");
    s.actors["character.bao"]!.health = 30;
    s = act(s, "skill.inverted-realm");
    expect(s.actors["character.bao"]!.health).toBeGreaterThan(30);
    expect(
      s.commandLog
        .at(-1)!
        .events.some(
          (e) =>
            e.payload.type === "battle.beat" &&
            e.payload.status === "inversion" &&
            e.payload.effect === "heal",
        ),
    ).toBe(true);
  });
  it("cures bleeding, revives and grants fury only when stitching a bleeding ally", () => {
    let s = empowered("path.flesh-stitcher", 9);
    s.actors["character.lan"]!.health = 0;
    s.actors["character.lan"]!.status = "downed";
    s.combat!.tactics!.statuses.push({
      actorId: "character.lan",
      sourceId: "character.hunger",
      kind: "bleed",
      remainingTurns: 2,
      potency: 3,
    });
    s = act(s, "skill.red-suture", "character.lan");
    expect(s.actors["character.lan"]!.status).toBe("active");
    expect(
      s.combat!.tactics!.statuses.some(
        (st) => st.actorId === "character.lan" && st.kind === "bleed",
      ),
    ).toBe(false);
    expect(
      s.combat!.tactics!.statuses.find(
        (st) => st.actorId === "character.lan" && st.kind === "fury",
      )?.potency,
    ).toBe(4);
  });
  it("skips exactly one activation when the seeded stun succeeds", () => {
    let successes = 0,
      failures = 0;
    for (let seed = 0; seed < 12; seed++) {
      let s = empowered("path.bell-medium", 8);
      s.rng.state = seed;
      // Keep the crafted fixture log chain consistent with its altered final RNG.
      s.commandLog.at(-1)!.rngAfter.state = seed;
      s = act(s, "skill.bell-echo", "character.hunger");
      const events = s.commandLog.at(-1)!.events;
      const skipped = events.some(
        (e) =>
          e.payload.type === "battle.beat" &&
          e.payload.status === "stun" &&
          e.payload.amount === 0,
      );
      if (skipped) {
        successes++;
        expect(
          events.some(
            (e) =>
              e.payload.type === "battle.beat" &&
              e.payload.actorId === "character.hunger" &&
              e.payload.effect === "damage",
          ),
        ).toBe(false);
        expect(
          s.combat!.tactics!.statuses.some(
            (st) => st.actorId === "character.hunger" && st.kind === "stun",
          ),
        ).toBe(false);
      } else failures++;
    }
    expect(successes).toBeGreaterThan(0);
    expect(failures).toBeGreaterThan(0);
  });
  it("previews barrier absorption and evasion without consuming statuses or RNG", () => {
    const s = empowered("path.mirror-walker");
    const rng = { ...s.rng };
    s.combat!.tactics!.statuses.push({
      actorId: "character.hunger",
      sourceId: "character.minh",
      kind: "barrier",
      remainingTurns: 2,
      potency: 100,
    });
    expect(
      tacticalDamageRange(s, "character.minh", "character.hunger", def),
    ).toEqual([0, 0]);
    s.combat!.tactics!.statuses[0]!.kind = "evade";
    expect(
      tacticalDamageRange(s, "character.minh", "character.hunger", def),
    ).toEqual([0, 0]);
    expect(s.rng).toEqual(rng);
    expect(s.combat!.tactics!.statuses).toHaveLength(1);
  });
  it("keeps auto on accepted commands for an awakened party and stops at aftermath", () => {
    let s = empowered("path.bell-medium");
    for (let i = 0; s.combat?.phase === "active" && i < 90; i++) {
      const p = autoCombatAction(s, def);
      expect(p).not.toBeNull();
      s = take(s, p!);
    }
    expect(s.combat?.phase).toBe("aftermath");
    expect(autoCombatAction(s, def)).toBeNull();
  });
});

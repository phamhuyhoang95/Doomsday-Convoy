import { describe, it, expect } from "vitest";
import { lamplightDefinition as def } from "../src/content/lamplight";
import { resonanceDefinition as old } from "../src/content/resonance";
import { createGame } from "../src/core/state";
import { processCommand } from "../src/core/processor";
import type { GameCommand } from "../src/core/commands";
import type { GameState } from "../src/core/state-schema";
import { serializeGame, loadGame } from "../src/persistence/save";
import { inspectWorldDefinition } from "../src/world/registry";
import { createActor } from "../src/core/actors";
import { enemyIntent } from "../src/combat/tactical-engine";
const run = (s: GameState, p: GameCommand["payload"], definition = def) =>
  processCommand(
    s,
    {
      id: `command.${s.commandLog.length + 1}`,
      issuerId: s.player.id,
      payload: p,
    },
    { principalId: s.player.id },
    definition,
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
function ready() {
  let s = createGame(42, def);
  s = choose(s, "prepare");
  s = choose(s, "radio-ignore");
  return choose(s, "study-awakening");
}
function hospital() {
  let s = travel(ready(), "route.garage-market");
  s = choose(s, "leave-ha");
  s = choose(s, "leave-cache");
  s = travel(s, "route.market-service");
  s = choose(s, "take-lantern");
  s = choose(s, "listen-stranger");
  s = choose(s, "read-carrier");
  s = travel(s, "route.service-hospital");
  return choose(s, "listen");
}
const enter = (s = hospital(), actorId = "character.minh") =>
  take(s, {
    type: "field-enter",
    convoyId: s.player.convoyId,
    siteId: "field.thanh-an",
    actorId,
  });
const step = (
  s: GameState,
  direction: "north" | "south" | "east" | "west",
  running = false,
) =>
  take(s, {
    type: "field-step",
    convoyId: s.player.convoyId,
    action: "move",
    direction,
    run: running,
  });
const interact = (s: GameState, objectId: string) =>
  take(s, { type: "field-interact", convoyId: s.player.convoyId, objectId });
const torch = (s: GameState) =>
  take(s, { type: "field-step", convoyId: s.player.convoyId, action: "torch" });
const exit = (s: GameState, rescue = false) =>
  take(s, { type: "field-exit", convoyId: s.player.convoyId, rescue });
function walkTo(s: GameState, x: number, y: number) {
  for (let n = 0; n < 100; n++) {
    const p = s.fieldwork!.expedition!.position;
    if (p.x === x && p.y === y) return s;
    s = step(
      s,
      p.x < x ? "east" : p.x > x ? "west" : p.y < y ? "south" : "north",
    );
  }
  throw new Error("route failed");
}
function market() {
  return travel(ready(), "route.garage-market");
}
const marketStart = (
  s = market(),
  scoutIds = ["character.minh", "character.bao"],
  guardId = "character.lan",
) =>
  take(s, {
    type: "scenario-start",
    convoyId: s.player.convoyId,
    scenarioId: "scenario.market-blackout",
    scoutIds,
    guardId,
  });
const node = (s: GameState, targetNodeId: string) =>
  take(s, { type: "scenario-move", convoyId: s.player.convoyId, targetNodeId });
const action = (s: GameState, actionId: string) =>
  take(s, {
    type: "scenario-act",
    convoyId: s.player.convoyId,
    nodeId: s.scenario!.currentNodeId,
    actionId,
  });
const finishMarket = (s: GameState) =>
  take(s, {
    type: "scenario-finish",
    convoyId: s.player.convoyId,
    chosenModuleId: "module.fuel-tank",
  });
describe("Lamplight field exploration", () => {
  it("rejects a disconnected room or an actor starting in a closed door during content validation", () => {
    const disconnected = structuredClone(def);
    disconnected.campaign!.fieldwork!.sites[0]!.grid[4] = "#.....#.....#.....#";
    expect(
      inspectWorldDefinition(disconnected).some(
        (i) => i.message === "Disconnected field points",
      ),
    ).toBe(true);
    const blocked = structuredClone(def);
    blocked.campaign!.fieldwork!.sites[0]!.start = { x: 6, y: 4 };
    expect(
      inspectWorldDefinition(blocked).some(
        (i) => i.message === "Actor starts inside closed door",
      ),
    ).toBe(true);
  });
  it("keeps Resonance initial state and rules separate", () => {
    expect(createGame(42, old).fieldwork).toBeUndefined();
    expect(
      createGame(42, old).convoys[def.start.convoyId]!.resources.food,
    ).toBe(96);
    expect(
      createGame(42, def).convoys[def.start.convoyId]!.resources.food,
    ).toBe(84);
  });
  it("rejects wrong location/owner and leaves command/state/RNG untouched", () => {
    for (const s of [ready(), hospital()]) {
      const r = run(s, {
        type: "field-enter",
        convoyId: s.player.convoyId,
        siteId: "field.thanh-an",
        actorId:
          s.convoys[s.player.convoyId]!.locationId === "location.hospital"
            ? "character.raven"
            : "character.minh",
      });
      expect(r.ok).toBe(false);
      expect(r.state).toBe(s);
      expect(r.events).toEqual([]);
    }
  });
  it("reserves exactly two world hours and actual crew rations once; blocks unrelated commands", () => {
    const before = hospital(),
      s = enter(before),
      id = s.player.convoyId;
    expect(s.world.tick - before.world.tick).toBe(2);
    expect(
      before.convoys[id]!.resources.food - s.convoys[id]!.resources.food,
    ).toBe(6);
    for (const p of [
      { type: "wait", convoyId: id, ticks: 1 },
      {
        type: "choose",
        convoyId: id,
        instanceId: s.activeEvents[0]!.instanceId,
        choiceId: "read-hospital",
      },
    ] as GameCommand["payload"][]) {
      const r = run(s, p);
      expect(r.ok).toBe(false);
      expect(r.state).toBe(s);
    }
    const moved = step(s, "east");
    expect(moved.world.tick).toBe(s.world.tick);
    expect(moved.convoys[id]!.resources).toEqual(s.convoys[id]!.resources);
  });
  it("accepts the exact reserved shift plus one-hour ration buffer without charging twice", () => {
    const before = hospital();
    before.convoys[before.player.convoyId]!.resources.food = 9;
    before.convoys[before.player.convoyId]!.resources.water = 9;
    const after = enter(before);
    expect(after.convoys[after.player.convoyId]!.resources.food).toBe(3);
    expect(after.convoys[after.player.convoyId]!.resources.water).toBe(3);
    expect(after.fieldwork!.expedition!.phase).toBe("active");
  });
  it("requires a remaining ration buffer and rejects atomic entry without it", () => {
    const s = hospital();
    s.convoys[s.player.convoyId]!.resources.food = 6;
    const r = run(s, {
      type: "field-enter",
      convoyId: s.player.convoyId,
      siteId: "field.thanh-an",
      actorId: "character.minh",
    });
    expect(r.ok).toBe(false);
    expect(r.state).toBe(s);
  });
  it("collides with walls/closed doors and permits opening only in reach", () => {
    let s = enter();
    const far = run(s, {
      type: "field-interact",
      convoyId: s.player.convoyId,
      objectId: "field.door-west",
    });
    expect(far.ok).toBe(false);
    s = walkTo(s, 5, 4);
    const wall = run(s, {
      type: "field-step",
      convoyId: s.player.convoyId,
      action: "move",
      direction: "east",
    });
    expect(wall.ok).toBe(false);
    expect(wall.state).toBe(s);
    s = interact(s, "field.door-west");
    s = step(s, "east");
    expect(s.fieldwork!.expedition!.position).toEqual({ x: 6, y: 4 });
    const close = run(s, {
      type: "field-interact",
      convoyId: s.player.convoyId,
      objectId: "field.door-west",
    });
    expect(close.ok).toBe(false);
  });
  it("runs two cells without jumping a closed door and pays two battery units", () => {
    let s = enter();
    s = step(s, "east", true);
    const battery = s.fieldwork!.expedition!.battery;
    s = step(s, "east", true);
    expect(s.fieldwork!.expedition!.position).toEqual({ x: 5, y: 4 });
    expect(s.fieldwork!.expedition!.battery).toBe(battery - 2);
  });
  it("moves shadow only for noise in darkness; observing contrast discovers the rule", () => {
    let s = enter();
    const e = s.fieldwork!.expedition!;
    e.position = { x: 11, y: 4 };
    e.openDoors = ["field.door-west", "field.door-east"];
    e.torch = false;
    const before = { ...e.shadow };
    s = step(s, "east");
    expect(s.fieldwork!.expedition!.shadow).not.toEqual(before);
    expect(s.knowledge.factIds).not.toContain("field.shadow-rule");
    s = torch(s);
    const now = { ...s.fieldwork!.expedition!.shadow };
    s = step(s, "east");
    expect(s.fieldwork!.expedition!.shadow).toEqual(now);
    expect(s.knowledge.factIds).toContain("field.shadow-rule");
  });
  it("keeps a silent wait harmless in darkness and spends no world time", () => {
    let s = enter();
    s.fieldwork!.expedition!.torch = false;
    const before = { ...s.fieldwork!.expedition!.shadow };
    s = take(s, {
      type: "field-step",
      convoyId: s.player.convoyId,
      action: "wait",
    });
    expect(s.fieldwork!.expedition!.shadow).toEqual(before);
    expect(s.fieldwork!.expedition!.beat).toBe(1);
  });
  it("caps the bag, prevents duplicate loot and pays real medicine once on return", () => {
    let s = enter();
    const e = s.fieldwork!.expedition!;
    e.position = { x: 10, y: 5 };
    s = interact(s, "field.medicine");
    expect(s.convoys[s.player.convoyId]!.resources.medicine).toBe(8);
    const duplicate = run(s, {
      type: "field-interact",
      convoyId: s.player.convoyId,
      objectId: "field.medicine",
    });
    expect(duplicate.ok).toBe(false);
    s.fieldwork!.expedition!.position = { x: 16, y: 5 };
    s = interact(s, "field.logbook");
    s.fieldwork!.expedition!.position = { x: 16, y: 2 };
    const full = run(s, {
      type: "field-interact",
      convoyId: s.player.convoyId,
      objectId: "field.toolcase",
    });
    expect(full.ok).toBe(false);
    s.fieldwork!.expedition!.position = { x: 2, y: 4 };
    const tick = s.world.tick;
    s = exit(s);
    expect(s.world.tick).toBe(tick);
    expect(s.convoys[s.player.convoyId]!.resources.medicine).toBe(11);
    expect(s.knowledge.factIds).toContain("lore.lamplight");
    const repeat = run(s, {
      type: "field-exit",
      convoyId: s.player.convoyId,
      rescue: false,
    });
    expect(repeat.ok).toBe(false);
    const restart = run(s, {
      type: "field-enter",
      convoyId: s.player.convoyId,
      siteId: "field.thanh-an",
      actorId: "character.minh",
    });
    expect(restart.ok).toBe(false);
  });
  it("lets an early exit keep route open; rescue abandons loot and injures actor/vehicle", () => {
    const s = exit(enter());
    expect(s.fieldwork!.expedition!.phase).toBe("returned");
    expect(s.status).toBe("active");
    let r = enter();
    r.fieldwork!.expedition!.position = { x: 10, y: 5 };
    r = interact(r, "field.medicine");
    const hp = r.actors["character.minh"]!.health,
      vehicle = r.convoys[r.player.convoyId]!.vehicle.condition;
    r = exit(r, true);
    expect(r.actors["character.minh"]!.health).toBe(hp - 4);
    expect(r.convoys[r.player.convoyId]!.vehicle.condition).toBe(vehicle - 8);
    expect(r.convoys[r.player.convoyId]!.resources.medicine).toBe(8);
    expect(r.fieldwork!.expedition!.cargo).toEqual([]);
  });
  it("hits the player, drops one item and returns them to the light without softlocking", () => {
    let s = enter();
    const e = s.fieldwork!.expedition!;
    e.position = { x: 14, y: 4 };
    e.shadow = { x: 15, y: 4 };
    e.openDoors = ["field.door-west", "field.door-east"];
    e.torch = false;
    e.collected = ["field.medicine"];
    e.cargo = ["field.medicine"];
    const hp = s.actors["character.minh"]!.health;
    s = step(s, "east");
    expect(s.actors["character.minh"]!.health).toBe(hp - 12);
    expect(s.fieldwork!.expedition!.cargo).toEqual([]);
    expect(s.fieldwork!.expedition!.position).toEqual({ x: 2, y: 4 });
    expect(exit(s).status).toBe("active");
  });
  it("does not claim an approaching shadow while a closed door blocks its path", () => {
    let s = enter();
    s = torch(s);
    s = walkTo(s, 5, 4);
    expect(s.fieldwork!.expedition!.shadow).toEqual(
      def.campaign!.fieldwork!.sites[0]!.shadowStart,
    );
    expect(s.fieldwork!.expedition!.observations).toBe(0);
    expect(s.fieldwork!.expedition!.cue).toBe("knock");
  });
  it("brings back medicine and the sealed record through real commands with careful light use", () => {
    let s = torch(enter());
    s = walkTo(s, 5, 4);
    s = interact(s, "field.door-west");
    s = walkTo(s, 10, 5);
    s = interact(s, "field.medicine");
    s = walkTo(s, 11, 4);
    s = interact(s, "field.door-east");
    s = step(s, "east");
    expect(s.fieldwork!.expedition!.cue).toBe("advance");
    s = torch(s);
    s = step(s, "east");
    s = step(s, "south");
    s = walkTo(s, 16, 5);
    s = interact(s, "field.logbook");
    expect(loadGame(serializeGame(s, def), def)).toEqual(s);
    s = walkTo(s, 13, 5);
    s = step(s, "north");
    s = walkTo(s, 11, 4);
    s = interact(s, "field.door-east");
    s = torch(s);
    s = walkTo(s, 2, 4);
    s = exit(s);
    expect(s.fieldwork!.expedition!.strikes).toBe(0);
    expect(s.knowledge.factIds).toContain("lore.lamplight");
    expect(s.knowledge.factIds).toContain("field.shadow-rule");
    expect(s.convoys[s.player.convoyId]!.resources.medicine).toBe(11);
    expect(loadGame(serializeGame(s, def), def)).toEqual(s);
  });
  it("forces extraction at the local cap without extra world hours", () => {
    let s = enter();
    s.fieldwork!.expedition!.beat = 95;
    const tick = s.world.tick;
    s = take(s, {
      type: "field-step",
      convoyId: s.player.convoyId,
      action: "wait",
    });
    expect(s.fieldwork!.expedition!.phase).toBe("rescued");
    expect(s.world.tick).toBe(tick);
  });
  it("replays a real command-driven journey, mid-room save and return byte-equivalently", () => {
    let s = enter();
    s = walkTo(s, 5, 4);
    s = interact(s, "field.door-west");
    s = walkTo(s, 10, 5);
    s = interact(s, "field.medicine");
    expect(loadGame(serializeGame(s, def), def)).toEqual(s);
    s = walkTo(s, 7, 4);
    s = walkTo(s, 2, 4);
    s = exit(s);
    expect(s.convoys[s.player.convoyId]!.resources.medicine).toBe(11);
    expect(loadGame(serializeGame(s, def), def)).toEqual(s);
  });
});
describe("Lamplight corrected scenario and tactical pressure", () => {
  it("rejects duplicate scouts and wrong scenario ID atomically", () => {
    const s = market();
    for (const p of [
      {
        type: "scenario-start",
        convoyId: s.player.convoyId,
        scenarioId: "scenario.market-blackout",
        scoutIds: ["character.minh", "character.minh"],
        guardId: "character.lan",
      },
      {
        type: "scenario-start",
        convoyId: s.player.convoyId,
        scenarioId: "scenario.invalid",
        scoutIds: ["character.minh", "character.bao"],
        guardId: "character.lan",
      },
    ] as GameCommand["payload"][]) {
      const r = run(s, p);
      expect(r.ok).toBe(false);
      expect(r.state).toBe(s);
    }
  });
  it("reserves actual living crew rations at entry, settles cargo/module exactly once and replays", () => {
    let s = market();
    const tick = s.world.tick,
      food = s.convoys[s.player.convoyId]!.resources.food;
    s = marketStart(s);
    expect(s.world.tick).toBe(tick + 2);
    expect(s.convoys[s.player.convoyId]!.resources.food).toBe(food - 6);
    s = node(s, "node.stalls");
    s = node(s, "node.warehouse");
    s = action(s, "act.take-fuel");
    s = node(s, "node.stalls");
    s = node(s, "node.parking");
    const fuel = s.convoys[s.player.convoyId]!.resources.fuel;
    s = finishMarket(s);
    expect(s.convoys[s.player.convoyId]!.resources.fuel).toBe(fuel + 15);
    expect(s.scenario!.cargo).toEqual([]);
    expect(s.world.tick).toBe(tick + 2);
    const repeat = run(s, {
      type: "scenario-finish",
      convoyId: s.player.convoyId,
      chosenModuleId: "module.triage-unit",
    });
    expect(repeat.ok).toBe(false);
    expect(repeat.state).toBe(s);
    expect(loadGame(serializeGame(s, def), def)).toEqual(s);
  });
  it("counts a fourth captured living passenger in entry rations, including water", () => {
    const before = market(),
      convoy = before.convoys[before.player.convoyId]!;
    const ha = createActor(
      def.characters.find((a) => a.id === "character.ha")!,
      convoy.id,
      true,
    );
    ha.status = "captured";
    before.actors[ha.id] = ha;
    convoy.actorIds.push(ha.id);
    const after = marketStart(before);
    expect(
      convoy.resources.food - after.convoys[convoy.id]!.resources.food,
    ).toBe(8);
    expect(
      convoy.resources.water - after.convoys[convoy.id]!.resources.water,
    ).toBe(8);
  });
  it("does not charge another world hour or rations when a reserved scenario starts combat", () => {
    let s = marketStart();
    s = node(s, "node.stalls");
    s = node(s, "node.power");
    s = action(s, "act.start-generator");
    s = node(s, "node.warehouse");
    s = action(s, "act.take-fuel");
    s = node(s, "node.stalls");
    s = node(s, "node.parking");
    expect(s.scenario!.phase).toBe("crisis");
    const tick = s.world.tick,
      resources = { ...s.convoys[s.player.convoyId]!.resources };
    s = take(s, {
      type: "scenario-crisis",
      convoyId: s.player.convoyId,
      method: "combat",
    });
    expect(s.combat).not.toBeNull();
    expect(s.world.tick).toBe(tick);
    expect(s.convoys[s.player.convoyId]!.resources).toEqual(resources);
    expect(loadGame(serializeGame(s, def), def)).toEqual(s);
  });
  it("cannot wire with zero scrap, cannot act without a mechanic, and no resources are clamped away", () => {
    let s = marketStart();
    s = node(s, "node.stalls");
    s = node(s, "node.power");
    s.convoys[s.player.convoyId]!.resources.scrap = 0;
    const r = run(s, {
      type: "scenario-act",
      convoyId: s.player.convoyId,
      nodeId: "node.power",
      actionId: "act.wire-silently",
    });
    expect(r.ok).toBe(false);
    expect(r.state).toBe(s);
    let noRole = marketStart(
      market(),
      ["character.minh", "character.lan"],
      "character.bao",
    );
    noRole = node(noRole, "node.stalls");
    noRole = node(noRole, "node.power");
    expect(
      run(noRole, {
        type: "scenario-act",
        convoyId: noRole.player.convoyId,
        nodeId: "node.power",
        actionId: "act.wire-silently",
      }).ok,
    ).toBe(false);
  });
  it("does not change Resonance enemy stats; new opening shield and earlier vehicle intent are real", () => {
    expect(
      old.characters.find((a) => a.id === "character.raven")!.maxHealth,
    ).toBe(36);
    expect(
      def.characters.find((a) => a.id === "character.raven")!.maxHealth,
    ).toBe(64);
    let s = travel(ready(), "route.garage-market");
    s = choose(s, "leave-ha");
    s = choose(s, "raid-cache");
    const enemy = s.combat!.enemyConvoyId,
      first = s.convoys[enemy]!.actorIds[0]!;
    expect(
      s.combat!.tactics!.statuses.some(
        (st) => st.actorId === first && st.kind === "guard",
      ),
    ).toBe(true);
    const second = s.convoys[enemy]!.actorIds[1]!;
    s.combat!.tactics!.actorTurns[second] = 1;
    expect(enemyIntent(s, second, false, def)?.vehicle).toBe(true);
    expect(enemyIntent(s, second, false, old)?.vehicle).toBe(false);
  });
});

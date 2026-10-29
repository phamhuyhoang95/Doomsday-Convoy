import { describe, expect, it } from "vitest";
import { argonDefinition as def, argonAbilities } from "../src/content/argon";
import { campaignDefinition } from "../src/content/campaign";
import { createGame } from "../src/core/state";
import { processCommand } from "../src/core/processor";
import type { GameCommand } from "../src/core/commands";
import type { GameState } from "../src/core/state-schema";
import { campaignChoice } from "../src/simulation/campaign";
import { travelCommand } from "../src/simulation/scenarios";
import { currentCombatActor } from "../src/combat/engine";
import {
  abilityReason,
  attackReason,
  tacticalDamageRange,
} from "../src/combat/tactical-engine";
import { loadGame, serializeGame } from "../src/persistence/save";

const command = (
  state: GameState,
  payload: GameCommand["payload"],
): GameCommand => ({
  id: `command.${state.commandLog.length + 1}`,
  issuerId: state.player.id,
  payload,
});
const run = (state: GameState, payload: GameCommand["payload"]) =>
  processCommand(
    state,
    command(state, payload),
    { principalId: state.player.id },
    def,
  );
function take(state: GameState, payload: GameCommand["payload"]): GameState {
  const result = run(state, payload);
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}
function battle(seed = 42): GameState {
  let s = createGame(seed, def);
  s = take(s, campaignChoice(s, "prepare").payload);
  s = take(s, travelCommand(s, "route.garage-market").payload);
  s = take(s, campaignChoice(s, "leave-ha").payload);
  return take(s, campaignChoice(s, "raid-cache").payload);
}
const action = (
  s: GameState,
  data: Partial<
    Extract<GameCommand["payload"], { type: "battle-action" }>
  > = {},
): GameCommand["payload"] => ({
  type: "battle-action",
  convoyId: s.player.convoyId,
  actorId: currentCombatActor(s)!.id,
  action: "guard",
  ...data,
});

describe("Argon battle contracts", () => {
  it("keeps legacy rules separate and charges world time on entry, not per turn", () => {
    expect(campaignDefinition.campaign?.tactics).toBeUndefined();
    const s = battle();
    const convoy = s.convoys[s.player.convoyId]!;
    const result = run(
      s,
      action(s, { action: "attack", targetId: "character.hunger" }),
    );
    expect(result.ok).toBe(true);
    expect(result.state.world.tick).toBe(s.world.tick);
    expect(result.state.convoys[s.player.convoyId]!.resources.food).toBe(
      convoy.resources.food,
    );
    expect(
      result.events.some(
        (e) =>
          e.payload.type === "battle.beat" &&
          e.payload.actorId === "character.hunger",
      ),
    ).toBe(true);
    expect(s.actors["character.hunger"]!.health).toBe(
      def.characters.find((c) => c.id === "character.hunger")!.maxHealth,
    );
  });
  it("rejects back-row melee and wrong-turn actions without mutation or RNG draws", () => {
    let s = battle();
    s = take(s, action(s));
    expect(currentCombatActor(s)?.id).toBe("character.lan");
    expect(attackReason(s, "character.lan", "character.hunger")).not.toBe("");
    const result = run(
      s,
      action(s, { action: "attack", targetId: "character.hunger" }),
    );
    expect(result.ok).toBe(false);
    expect(result.state).toBe(s);
    expect(result.events).toEqual([]);
    const wrong = run(s, action(s, { actorId: "character.bao" }));
    expect(wrong.ok ? null : wrong.error.code).toBe("NOT_YOUR_TURN");
    expect(wrong.state).toBe(s);
  });
  it("makes armor break improve follow-up attacks and preserves exact event health deltas", () => {
    let s = battle();
    const ability = argonAbilities.find((a) => a.id === "skill.glass-sever")!;
    const before = tacticalDamageRange(
      s,
      "character.minh",
      "character.hunger",
      def,
      ability,
    );
    s = take(
      s,
      action(s, {
        action: "ability",
        abilityId: "skill.strike",
        targetId: "character.hunger",
      }),
    );
    expect(
      s.combat?.tactics?.statuses.some(
        (t) => t.actorId === "character.hunger" && t.kind === "armor-broken",
      ),
    ).toBe(true);
    const after = tacticalDamageRange(
      s,
      "character.minh",
      "character.hunger",
      def,
      ability,
    );
    expect(after[0]).toBeGreaterThan(before[0]);
    for (const e of s.commandLog.at(-1)!.events)
      if (e.payload.type === "battle.beat" && e.payload.effect === "damage")
        expect(e.payload.healthBefore! - e.payload.healthAfter!).toBe(
          e.payload.amount,
        );
  });
  it("makes movement consume the actor turn and swaps real formation slots", () => {
    const s = battle();
    const from = s.combat!.tactics!.positions["character.minh"];
    const next = take(s, action(s, { action: "move", slot: 2 }));
    expect(next.combat!.tactics!.positions["character.minh"]).toBe(2);
    expect(next.combat!.tactics!.positions["character.lan"]).toBe(from);
    expect(currentCombatActor(next)?.id).not.toBe("character.minh");
  });
  it("caps vehicle support at one action per round and enforces artifact ownership", () => {
    let s = battle();
    s = take(
      s,
      action(s, {
        action: "ability",
        abilityId: "skill.headlight",
        targetId: "character.hunger",
      }),
    );
    const second = run(
      s,
      action(s, {
        action: "ability",
        abilityId: "skill.headlight",
        targetId: "character.hunger",
      }),
    );
    expect(second.ok).toBe(false);
    expect(second.state).toBe(s);
    const mirror = argonAbilities.find((a) => a.id === "skill.mirror-ward")!;
    expect(
      abilityReason(s, currentCombatActor(s)!.id, mirror, undefined),
    ).toContain("kỳ vật");
  });
  it("counts cooldowns by the acting character's turns without advancing world time", () => {
    let s = battle();
    const tick = s.world.tick;
    s = take(
      s,
      action(s, {
        action: "ability",
        abilityId: "skill.strike",
        targetId: "character.hunger",
      }),
    );
    for (
      let i = 0;
      currentCombatActor(s)?.id !== "character.minh" && i < 8;
      i++
    )
      s = take(s, action(s));
    const blocked = run(
      s,
      action(s, {
        action: "ability",
        abilityId: "skill.strike",
        targetId: "character.hunger",
      }),
    );
    expect(blocked.ok).toBe(false);
    expect(blocked.state).toBe(s);
    s = take(s, action(s));
    for (
      let i = 0;
      currentCombatActor(s)?.id !== "character.minh" && i < 8;
      i++
    )
      s = take(s, action(s));
    expect(
      run(
        s,
        action(s, {
          action: "ability",
          abilityId: "skill.strike",
          targetId: "character.hunger",
        }),
      ).ok,
    ).toBe(true);
    expect(s.world.tick).toBe(tick);
    expect(loadGame(serializeGame(s, def), def)).toEqual(s);
  });
  it("lets enemy intent target and damage the vehicle, and repairing restores real condition", () => {
    let s = battle();
    const tick = s.world.tick;
    for (
      let i = 0;
      s.convoys[s.player.convoyId]!.vehicle.condition === 100 && i < 12;
      i++
    )
      s = take(s, action(s));
    const vehicle = s.convoys[s.player.convoyId]!.vehicle;
    expect(vehicle.condition).toBeLessThan(100);
    expect(
      s.commandLog
        .flatMap((r) => r.events)
        .some(
          (e) =>
            e.payload.type === "battle.beat" &&
            e.payload.targetId === vehicle.id &&
            e.payload.effect === "damage",
        ),
    ).toBe(true);
    const before = vehicle.condition,
      scrap = s.convoys[s.player.convoyId]!.resources.scrap;
    s = take(
      s,
      action(s, { action: "ability", abilityId: "skill.field-repair" }),
    );
    expect(s.convoys[s.player.convoyId]!.vehicle.condition).toBe(
      Math.min(100, before + 15),
    );
    expect(s.convoys[s.player.convoyId]!.resources.scrap).toBe(scrap - 2);
    expect(s.world.tick).toBe(tick);
  });
  it("rejects a target from another encounter and missing abilities atomically", () => {
    const s = battle();
    for (const payload of [
      action(s, { action: "attack", targetId: "character.raven" }),
      action(s, { action: "ability", abilityId: "skill.not-real" }),
    ]) {
      const r = run(s, payload);
      expect(r.ok).toBe(false);
      expect(r.state).toBe(s);
      expect(r.events).toEqual([]);
    }
  });

  it("returns from a scenario battle, charges entry once and installs the real module", () => {
    let s = createGame(42, def);
    s = take(s, campaignChoice(s, "prepare").payload);
    s = take(s, travelCommand(s, "route.garage-market").payload);
    s = take(s, {
      type: "scenario-start",
      convoyId: s.player.convoyId,
      scenarioId: "scenario.market-blackout",
      scoutIds: ["character.minh", "character.bao"],
      guardId: "character.lan",
    });
    s = take(s, {
      type: "scenario-move",
      convoyId: s.player.convoyId,
      targetNodeId: "node.stalls",
    });
    s = take(s, {
      type: "scenario-move",
      convoyId: s.player.convoyId,
      targetNodeId: "node.warehouse",
    });
    for (const actionId of ["act.take-fuel", "act.take-scrap"])
      s = take(s, {
        type: "scenario-act",
        convoyId: s.player.convoyId,
        nodeId: "node.warehouse",
        actionId,
      });
    s = take(s, {
      type: "scenario-move",
      convoyId: s.player.convoyId,
      targetNodeId: "node.stalls",
    });
    s = take(s, {
      type: "scenario-move",
      convoyId: s.player.convoyId,
      targetNodeId: "node.parking",
    });
    expect(s.scenario?.phase).toBe("crisis");
    const before = s.world.tick;
    s = take(s, {
      type: "scenario-crisis",
      convoyId: s.player.convoyId,
      method: "combat",
    });
    expect(s.world.tick).toBe(before + 1);
    expect(s.combat?.tactics).toBeDefined();
    for (let i = 0; s.combat?.phase === "active" && i < 80; i++) {
      const actor = currentCombatActor(s)!;
      const target = Object.values(s.actors).find(
        (a) => !attackReason(s, actor.id, a.id),
      );
      const shot = argonAbilities.find(
        (a) =>
          a.effect === "damage" &&
          Object.values(s.actors).some(
            (t) => !abilityReason(s, actor.id, a, t.id),
          ),
      );
      const victim =
        shot &&
        Object.values(s.actors).find(
          (t) => !abilityReason(s, actor.id, shot, t.id),
        );
      s = take(
        s,
        shot && victim
          ? action(s, {
              action: "ability",
              abilityId: shot.id,
              targetId: victim.id,
            })
          : target
            ? action(s, { action: "attack", targetId: target.id })
            : action(s),
      );
    }
    expect(s.combat?.phase).toBe("aftermath");
    s = take(s, {
      type: "combat",
      convoyId: s.player.convoyId,
      actorId: currentCombatActor(s)!.id,
      action: "finish",
    });
    expect(s.scenario?.phase).toBe("completed");
    expect(s.world.tick).toBe(before + 1);
    s = take(s, {
      type: "scenario-finish",
      convoyId: s.player.convoyId,
      chosenModuleId: "module.triage-unit",
    });
    expect(s.scenario?.installedModuleId).toBe("module.triage-unit");
    expect(loadGame(serializeGame(s, def), def)).toEqual(s);
  });
  it("reflects damage once without capping the returned hit to the defender's HP", () => {
    const s = battle();
    s.actors["character.hunger"]!.health = 1;
    s.combat!.tactics!.statuses.push({
      actorId: "character.hunger",
      sourceId: "character.hunger",
      kind: "reflect",
      remainingTurns: 1,
      potency: 100,
    });
    const r = run(
      s,
      action(s, { action: "attack", targetId: "character.hunger" }),
    );
    expect(r.ok).toBe(true);
    const first = r.events.find((e) => e.payload.type === "battle.beat");
    expect(first?.payload).toMatchObject({
      type: "battle.beat",
      effect: "reflect",
      actorId: "character.hunger",
      targetId: "character.minh",
    });
    if (first?.payload.type === "battle.beat")
      expect(first.payload.amount).toBeGreaterThan(1);
    expect(r.state.actors["character.hunger"]!.health).toBe(1);
    expect(
      r.state.combat?.tactics?.statuses.some(
        (t) => t.actorId === "character.hunger" && t.kind === "reflect",
      ),
    ).toBe(false);
    expect(s.actors["character.minh"]!.health).toBe(100);
  });
  it("revives an ally and removes bleed in the same paid healing transaction", () => {
    let s = battle();
    s = take(s, action(s));
    s.actors["character.bao"]!.health = 0;
    s.actors["character.bao"]!.status = "downed";
    s.combat!.tactics!.statuses.push({
      actorId: "character.bao",
      sourceId: "character.hunger",
      kind: "bleed",
      remainingTurns: 2,
      potency: 4,
    });
    const medicine = s.convoys[s.player.convoyId]!.resources.medicine;
    const r = run(
      s,
      action(s, {
        action: "ability",
        abilityId: "skill.heal",
        targetId: "character.bao",
      }),
    );
    expect(r.ok).toBe(true);
    expect(r.state.actors["character.bao"]!.status).toBe("active");
    expect(r.state.actors["character.bao"]!.health).toBeGreaterThan(0);
    expect(
      r.state.combat?.tactics?.statuses.some(
        (t) => t.actorId === "character.bao" && t.kind === "bleed",
      ),
    ).toBe(false);
    expect(r.state.convoys[s.player.convoyId]!.resources.medicine).toBe(
      medicine - 1,
    );
    expect(r.state.world.tick).toBe(s.world.tick);
  });
  it.each([1, 42, 103])(
    "finishes seed %i, captures prisoners, round-trips save/replay",
    (seed) => {
      let s = battle(seed);
      for (let i = 0; s.combat?.phase === "active" && i < 80; i++) {
        const actor = currentCombatActor(s)!;
        const enemies = Object.values(s.actors).filter(
          (a) =>
            a.convoyId === s.combat?.enemyConvoyId && a.status === "active",
        );
        const available = argonAbilities.flatMap((a) => {
          const target =
            a.target === "enemy"
              ? enemies.find((t) => !abilityReason(s, actor.id, a, t.id))?.id
              : a.target === "ally"
                ? s.convoys[s.player.convoyId]!.actorIds.find(
                    (id) => !abilityReason(s, actor.id, a, id),
                  )
                : undefined;
          return !abilityReason(s, actor.id, a, target) && a.effect === "damage"
            ? [{ a, target }]
            : [];
        })[0];
        const target = enemies.find((t) => !attackReason(s, actor.id, t.id));
        s = take(
          s,
          available
            ? action(s, {
                action: "ability",
                abilityId: available.a.id,
                ...(available.target ? { targetId: available.target } : {}),
              })
            : target
              ? action(s, { action: "attack", targetId: target.id })
              : action(s),
        );
      }
      expect(s.combat?.phase).toBe("aftermath");
      expect(loadGame(serializeGame(s, def), def)).toEqual(s);
      const downed = Object.values(s.actors).filter(
        (a) => a.convoyId === s.combat?.enemyConvoyId && a.status === "downed",
      );
      for (const a of downed)
        s = take(s, {
          type: "combat",
          convoyId: s.player.convoyId,
          actorId: currentCombatActor(s)!.id,
          action: "capture",
          targetId: a.id,
        });
      s = take(s, {
        type: "combat",
        convoyId: s.player.convoyId,
        actorId: currentCombatActor(s)!.id,
        action: "finish",
      });
      expect(s.combat).toBeNull();
      expect(s.world.facts["cache.secured"]?.value).toBe(true);
      expect(loadGame(serializeGame(s, def), def)).toEqual(s);
    },
  );
});

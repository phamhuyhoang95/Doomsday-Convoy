import { describe, expect, it } from "vitest";
import { ASSET_KINDS, resolveAsset } from "../src/assets/registry";
import { campaignDefinition as def } from "../src/content/campaign";
import { worldDefinition } from "../src/content/world";
import { choice, event, never, setFact } from "../src/content/builders";
import { createGame } from "../src/core/state";
import { processCommand } from "../src/core/processor";
import { serializeGame, loadGame } from "../src/persistence/save";
import { campaignChoice, playCampaign } from "../src/simulation/campaign";
import { simulateCampaignBatch } from "../src/simulation/campaign-batch";
import { validateWorldDefinition } from "../src/world/registry";
import { travelCommand, waitCommand } from "../src/simulation/scenarios";

describe("final campaign acceptance and content pipeline", () => {
  it("has the bounded MVP content and starts with exactly three people", () => {
    expect(def.locations).toHaveLength(8);
    expect(def.campaign?.events).toHaveLength(12);
    expect(def.campaign?.skills).toHaveLength(4);
    expect(def.campaign?.artifacts).toHaveLength(2);
    expect(def.campaign?.anomalies).toHaveLength(1);
    expect(
      createGame(0, def).convoys[def.start.convoyId]?.actorIds,
    ).toHaveLength(3);
    expect(new Set(def.campaign?.assets.map((asset) => asset.kind))).toEqual(
      new Set(ASSET_KINDS),
    );
  });
  it("has materially different peaceful, trade, survival and ruthless endings", () => {
    const peaceful = playCampaign(42, "peaceful", def);
    const trade = playCampaign(42, "trade", def);
    const fallback = playCampaign(42, "fallback", def);
    const ruthless = playCampaign(42, "ruthless", def);
    expect(peaceful.state.ending?.id).toBe("ending.shared-dawn");
    expect(trade.state.ending?.id).toBe("ending.borrowed-dawn");
    expect(fallback.state.ending?.id).toBe("ending.empty-handed");
    expect(ruthless.state.ending?.id).toBe("ending.blood-road");
    expect(peaceful.state.actors["character.ha"]?.status).toBe("active");
    expect(ruthless.state.actors["character.ha"]).toBeUndefined();
  });
  it.each([
    { rescue: true, expected: "ending.keepers" },
    { rescue: false, expected: "ending.last-light" },
  ])(
    "reaches the remaining ending contract $expected",
    ({ rescue, expected }) => {
      let state = createGame(42, def);
      const take = (command: Parameters<typeof processCommand>[1]) => {
        const result = processCommand(
          state,
          command,
          { principalId: state.player.id },
          def,
        );
        if (!result.ok) throw new Error(result.error.message);
        state = result.state;
      };
      take(campaignChoice(state, "prepare"));
      take(travelCommand(state, "route.garage-market"));
      take(campaignChoice(state, rescue ? "rescue-ha" : "leave-ha"));
      take(campaignChoice(state, "search-cache"));
      if (rescue) {
        take(travelCommand(state, "route.market-service"));
        take(campaignChoice(state, "take-lantern"));
        take(campaignChoice(state, "listen-stranger"));
        take(travelCommand(state, "route.service-hospital"));
      } else take(travelCommand(state, "route.market-hospital"));
      take(campaignChoice(state, "listen"));
      take(campaignChoice(state, "read-records"));
      take(travelCommand(state, "route.hospital-ward"));
      take(campaignChoice(state, "ignore-patient"));
      take(campaignChoice(state, "bind-mirror"));
      take(travelCommand(state, "route.ward-checkpoint"));
      take(campaignChoice(state, "signal-passage"));
      take(campaignChoice(state, "press-on"));
      take(travelCommand(state, "route.checkpoint-refuge"));
      expect(state.status).toBe("won");
      expect(state.ending?.id).toBe(expected);
      expect(loadGame(serializeGame(state, def), def)).toEqual(state);
    },
  );
  it("finishes via the lantern when hospital and ward are inaccessible", () => {
    const run = playCampaign(7, "fallback", def);
    expect(run.issue).toBe(null);
    expect(run.state.status).toBe("won");
    expect(run.state.world.locations["location.hospital"]?.accessible).toBe(
      false,
    );
    expect(
      run.state.activeQuests.find(
        (quest) => quest.templateId === "quest.hospital",
      )?.status,
    ).toBe("alternative");
    expect(
      run.state.commandLog.some(
        (record) =>
          record.command.payload.type === "travel" &&
          record.command.payload.routeId === "route.service-checkpoint",
      ),
    ).toBe(true);
  });
  it("can skip the departure event, quarantine the hospital, and still finish", () => {
    let state = createGame(42, def);
    const take = (command: Parameters<typeof processCommand>[1]) => {
      const result = processCommand(
        state,
        command,
        { principalId: state.player.id },
        def,
      );
      if (!result.ok) throw new Error(result.error.message);
      state = result.state;
    };
    take(travelCommand(state, "route.garage-overpass"));
    expect(
      state.activeQuests.find((quest) => quest.templateId === "quest.departure")
        ?.status,
    ).toBe("alternative");
    take(campaignChoice(state, "follow-reflectors"));
    take(travelCommand(state, "route.overpass-service"));
    take(campaignChoice(state, "take-lantern"));
    take(campaignChoice(state, "quarantine-hospital"));
    take(travelCommand(state, "route.service-checkpoint"));
    take(campaignChoice(state, "yield-passage"));
    take(campaignChoice(state, "press-on"));
    take(travelCommand(state, "route.checkpoint-refuge"));
    expect(state.status).toBe("won");
    expect(state.activeQuests.every((quest) => quest.status !== "active")).toBe(
      true,
    );
  });
  it("closes unfinished contracts when the run is lost", () => {
    let state = createGame(42, def);
    for (const ticks of [12, 12, 8]) {
      const result = processCommand(
        state,
        waitCommand(state, ticks),
        { principalId: state.player.id },
        def,
      );
      if (!result.ok) throw new Error(result.error.message);
      state = result.state;
    }
    expect(state.status).toBe("lost");
    expect(state.activeQuests.every((quest) => quest.status !== "active")).toBe(
      true,
    );
    expect(loadGame(serializeGame(state, def), def)).toEqual(state);
  });
  it("rival acquires the mirror first and the story still resolves", () => {
    const custom = structuredClone(def);
    custom.campaign!.rival!.acquireAfterTick = 4;
    const content = validateWorldDefinition(custom);
    const run = playCampaign(42, "peaceful", content);
    expect(run.issue).toBe(null);
    expect(run.state.status).toBe("won");
    expect(run.state.world.facts["rival.stole-mirror"]?.value).toBe(true);
    expect(
      run.state.activeQuests.every((quest) => quest.status !== "active"),
    ).toBe(true);
    expect(loadGame(serializeGame(run.state, content), content)).toEqual(
      run.state,
    );
  });
  it("actual NPC deaths after an ownership transfer do not softlock the arc", () => {
    const custom = structuredClone(def);
    const content = custom.campaign!;
    content.events.push(
      event(
        "dead-rival-fixture",
        "location.garage",
        [
          choice("dead-rival-fixture", [
            {
              op: "artifact",
              artifactId: "artifact.mirror",
              fromOwnerId: "location.ward",
              toOwnerId: "convoy.rival",
            },
            { op: "actor", actorId: "character.raven", status: "dead" },
            { op: "actor", actorId: "character.ash", status: "dead" },
            setFact("story.departed"),
          ]),
        ],
        { op: "always" },
        999,
      ),
    );
    for (const key of [
      "event.dead-rival-fixture.title",
      "event.dead-rival-fixture.text",
      "choice.dead-rival-fixture",
      "outcome.dead-rival-fixture",
    ])
      content.texts[key] = "Death fallback scenario";
    const validated = validateWorldDefinition(custom);
    const run = playCampaign(42, "peaceful", validated);
    expect(run.issue).toBe(null);
    expect(run.state.status).toBe("won");
    expect(run.state.actors["character.raven"]?.status).toBe("dead");
    expect(
      run.state.activeQuests.find((quest) => quest.templateId === "quest.rival")
        ?.status,
    ).toBe("alternative");
    expect(
      run.state.activeQuests.every((quest) => quest.status !== "active"),
    ).toBe(true);
  });
  it("adds a normal exploration skill entirely through content data", () => {
    const custom = structuredClone(def);
    const skillId = "skill.warning";
    custom.campaign!.skills.push({
      id: skillId,
      name: "Warning",
      description: "Data only",
      target: "exploration",
      effect: "reveal",
      power: 0,
      energyCost: 1,
      costs: { food: 0, water: 0, fuel: 0, medicine: 0, scrap: 0 },
      cooldownTicks: 0,
      factId: "road.warning",
      requirements: { op: "always" },
    });
    custom.characters
      .find((character) => character.id === "character.lan")!
      .skillIds!.push(skillId);
    const content = validateWorldDefinition(custom);
    const state = createGame(42, content);
    const result = processCommand(
      state,
      {
        id: "command.1",
        issuerId: state.player.id,
        payload: {
          type: "use-skill",
          convoyId: state.player.convoyId,
          actorId: "character.lan",
          skillId,
        },
      },
      { principalId: state.player.id },
      content,
    );
    expect(result.ok).toBe(true);
    expect(result.state.knowledge.factIds).toContain("road.warning");
  });
  it("runs with no image/sound URIs and resolves missing assets", () => {
    expect(def.campaign?.assets.every((asset) => asset.uri === undefined)).toBe(
      true,
    );
    for (const kind of ASSET_KINDS)
      expect(resolveAsset([], "missing", kind).kind).toBe(kind);
    expect(playCampaign(0, "peaceful", def).state.status).toBe("won");
  });
  it.each([
    "negative-cost",
    "asset-cycle",
    "no-terminal-quest",
    "ending-fallback",
    "anomaly-cycle",
  ])("rejects %s content", (kind) => {
    const custom = structuredClone(def);
    const content = custom.campaign!;
    if (kind === "negative-cost")
      content.events[0]!.choices[0]!.costs.food = -1;
    if (kind === "asset-cycle")
      content.assets[0]!.fallbackId = content.assets[0]!.id;
    if (kind === "no-terminal-quest")
      Object.assign(content.quests[0]!, {
        successWhen: never,
        failureWhen: never,
        alternateWhen: never,
      });
    if (kind === "ending-fallback") content.endings.pop();
    if (kind === "anomaly-cycle")
      content.anomalies[0]!.violationEffects.push({
        op: "anomaly",
        anomalyId: "anomaly.bell",
        obey: false,
      });
    expect(() => validateWorldDefinition(custom)).toThrow();
  });
  it("migrates actual Phase 1 shape and rejects unknown future state", () => {
    const expected = createGame(42, worldDefinition);
    const legacy = JSON.parse(serializeGame(expected, worldDefinition)) as {
      schemaVersion: number;
      state: Record<string, unknown>;
    };
    legacy.schemaVersion = 1;
    legacy.state.schemaVersion = 1;
    delete legacy.state.campaign;
    expect(loadGame(JSON.stringify(legacy), worldDefinition)).toEqual(expected);
    legacy.state.schemaVersion = 999;
    expect(() => loadGame(JSON.stringify(legacy), worldDefinition)).toThrow(
      "Unsupported legacy state",
    );
  });
  it("multi-seed campaign policies finish or fail legitimately with save/replay", () => {
    const report = simulateCampaignBatch(8, def);
    expect(report.totals.runs).toBe(64);
    expect(report.totals.softlocks).toBe(0);
    expect(report.totals.rejectedCommands).toBe(0);
    expect(report.issues).toEqual([]);
    expect(report.totals.losses).toBe(16);
    expect(report.saveLoadChecks).toBe(64);
  }, 30000);
  it("refuses a story command with a forged artifact owner without changing RNG/state", () => {
    const state = createGame(0, def);
    const command = campaignChoice(state, "prepare");
    if (command.payload.type !== "choose") throw new Error("Wrong command");
    command.payload.choiceId = "trade-mirror";
    const result = processCommand(
      state,
      command,
      { principalId: state.player.id },
      def,
    );
    expect(result.ok).toBe(false);
    expect(result.state).toBe(state);
    expect(state.rng.draws).toBe(0);
  });
});

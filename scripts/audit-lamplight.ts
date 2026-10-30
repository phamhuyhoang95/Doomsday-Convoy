import { writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { lamplightDefinition as definition } from "../src/content/lamplight";
import { resonanceDefinition } from "../src/content/resonance";
import { createGame } from "../src/core/state";
import { processCommand } from "../src/core/processor";
import type { GameCommand } from "../src/core/commands";
import { serializeGame, loadGame } from "../src/persistence/save";
import { playCampaign } from "../src/simulation/campaign";

// Small, reproducible audit; these bots do not play the optional field area.
const policies = [
  "peaceful",
  "combat",
  "trade",
  "surrender",
  "fallback",
  "ruthless",
] as const;
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b),
    middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2;
};
const economy = [resonanceDefinition, definition].map((content) => ({
  contentVersion: content.contentVersion,
  policies: policies.map((policy) => {
    const states = Array.from(
      { length: 6 },
      (_, seed) => playCampaign(seed, policy, content).state,
    );
    const convoys = states.map((s) => s.convoys[s.player.convoyId]!);
    return {
      policy,
      wins: states.filter((s) => s.status === "won").length,
      medianHours: median(states.map((s) => s.world.tick)),
      medianFood: median(convoys.map((c) => c.resources.food)),
      medianWater: median(convoys.map((c) => c.resources.water)),
      medianFuel: median(convoys.map((c) => c.resources.fuel)),
      medianVehicle: median(convoys.map((c) => c.vehicle.condition)),
    };
  }),
}));

let state = createGame(42, definition);
const dispatchTimes: number[] = [],
  saveTimes: number[] = [];
function take(payload: GameCommand["payload"]) {
  const start = performance.now();
  const result = processCommand(
    state,
    {
      id: `command.${state.commandLog.length + 1}`,
      issuerId: state.player.id,
      payload,
    },
    { principalId: state.player.id },
    definition,
  );
  if (!result.ok) throw new Error(result.error.message);
  state = result.state;
  return performance.now() - start;
}
const choose = (choiceId: string) =>
  take({
    type: "choose",
    convoyId: state.player.convoyId,
    instanceId: state.activeEvents[0]!.instanceId,
    choiceId,
  });
const travel = (routeId: string) =>
  take({ type: "travel", convoyId: state.player.convoyId, routeId });
choose("prepare");
choose("radio-ignore");
choose("study-awakening");
travel("route.garage-market");
choose("leave-ha");
choose("leave-cache");
travel("route.market-service");
choose("take-lantern");
choose("listen-stranger");
choose("read-carrier");
travel("route.service-hospital");
choose("listen");
take({
  type: "field-enter",
  convoyId: state.player.convoyId,
  siteId: "field.thanh-an",
  actorId: "character.minh",
});
// Quiet waits exercise the longest log without changing the shadow or world clock.
for (let n = 0; n < 80; n++) {
  dispatchTimes.push(
    take({
      type: "field-step",
      convoyId: state.player.convoyId,
      action: "wait",
    }),
  );
  const start = performance.now();
  serializeGame(state, definition);
  saveTimes.push(performance.now() - start);
}
const save = serializeGame(state, definition),
  loadStart = performance.now();
loadGame(save, definition);
const stats = (values: number[]) => ({
  medianMs: +median(values).toFixed(2),
  p95Ms: +[...values]
    .sort((a, b) => a - b)
    [Math.floor(values.length * 0.95)]!.toFixed(2),
  maxMs: +Math.max(...values).toFixed(2),
});
const report = {
  runtime: process.version,
  economy,
  performance: {
    localActions: 80,
    totalCommands: state.commandLog.length,
    dispatch: stats(dispatchTimes),
    serializeWithReplay: stats(saveTimes),
    loadMs: +(performance.now() - loadStart).toFixed(2),
    saveBytes: Buffer.byteLength(save),
    note: "Node-only engine timings; not browser frame time. Field autosave debounces 650ms and flushes on exit/save/menu/load/hide.",
  },
};
await writeFile(
  "artifacts/lamplight-audit.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));

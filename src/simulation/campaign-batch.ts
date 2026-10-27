import { canonicalJson } from "../core/primitives";
import { loadGame, serializeGame } from "../persistence/save";
import type { WorldDefinition } from "../world/schema";
import { playCampaign } from "./campaign";
import { runSurvivalBot } from "./scenarios";

interface Counts {
  runs: number;
  wins: number;
  losses: number;
  softlocks: number;
  rejectedCommands: number;
}
const blank = (): Counts => ({
  runs: 0,
  wins: 0,
  losses: 0,
  softlocks: 0,
  rejectedCommands: 0,
});

export function simulateCampaignBatch(
  seedCount: number,
  definition: WorldDefinition,
  progress?: (completed: number, total: number) => void,
) {
  if (!Number.isSafeInteger(seedCount) || seedCount < 1 || seedCount > 10000)
    throw new RangeError("Invalid seed count");
  const policies = [
    "peaceful",
    "combat",
    "trade",
    "surrender",
    "fallback",
    "ruthless",
    "starvation",
    "hazard",
  ] as const;
  const totals = blank();
  const byPolicy: Record<string, Counts> = {};
  const endings: Record<string, number> = {};
  const issues: { seed: number; policy: string; issue: string }[] = [];
  let saveLoadChecks = 0;
  let maxCommands = 0;
  const hazardous = structuredClone(definition);
  hazardous.contentVersion += "-hazard-qa";
  hazardous.routes.forEach((route) => {
    route.risk = { chanceBps: 10000, minDamage: 100, maxDamage: 100 };
  });
  for (const policy of policies) {
    const counts = blank();
    byPolicy[policy] = counts;
    for (let seed = 0; seed < seedCount; seed += 1) {
      const content = policy === "hazard" ? hazardous : definition;
      const run =
        policy === "starvation"
          ? { ...runSurvivalBot(seed, content, "exhaustion"), issue: null }
          : playCampaign(
              seed,
              policy === "hazard" ? "peaceful" : policy,
              content,
            );
      const restored = loadGame(serializeGame(run.state, content), content);
      if (canonicalJson(restored) !== canonicalJson(run.state))
        throw new Error(`Save/load mismatch at ${seed}/${policy}`);
      saveLoadChecks += 1;
      maxCommands = Math.max(maxCommands, run.state.commandLog.length);
      for (const bucket of [counts, totals]) {
        bucket.runs += 1;
        bucket.wins += run.state.status === "won" ? 1 : 0;
        bucket.losses += run.state.status === "lost" ? 1 : 0;
        bucket.softlocks += run.state.status === "active" ? 1 : 0;
        bucket.rejectedCommands += run.rejectedCommands;
      }
      const ending = run.state.ending?.id ?? "unresolved";
      endings[ending] = (endings[ending] ?? 0) + 1;
      if (
        (run.issue || run.state.status === "active" || run.rejectedCommands) &&
        issues.length < 30
      )
        issues.push({ seed, policy, issue: run.issue ?? "unresolved" });
      if (totals.runs % 100 === 0)
        progress?.(totals.runs, seedCount * policies.length);
    }
  }
  return {
    contentVersion: definition.contentVersion,
    seedRange: [0, seedCount - 1],
    totals,
    byPolicy,
    endings,
    maxCommands,
    saveLoadChecks,
    replayVerifiedRuns: saveLoadChecks,
    issues,
  };
}

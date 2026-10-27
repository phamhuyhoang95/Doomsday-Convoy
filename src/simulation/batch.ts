import { SCENARIO_ROUTES } from '../content/world';
import { assertGameState } from '../core/invariants';
import { ENGINE_VERSION } from '../core/primitives';
import { assertReplayEquivalent } from '../core/replay';
import type { WorldDefinition } from '../world/schema';
import { runRouteScenario, runSurvivalBot } from './scenarios';

interface Counts { runs: number; wins: number; losses: number; softlocks: number; rejectedCommands: number }
const blankCounts = (): Counts => ({ runs: 0, wins: 0, losses: 0, softlocks: 0, rejectedCommands: 0 });

/** No wall-clock values in results, so statistics themselves are reproducible. */
export function simulateBatch(seedCount: number, definition: WorldDefinition) {
  if (!Number.isSafeInteger(seedCount) || seedCount < 1 || seedCount > 10_000) throw new RangeError('Seed count must be in [1, 10000].');
  const strategies = ['direct', 'detour', 'bypass', 'wander', 'exhaustion'] as const;
  const totals = blankCounts();
  const byStrategy: Record<string, Counts> = {};
  const failureReasons: Record<string, number> = {};
  const problemSamples: { seed: number; strategy: string; issue: string }[] = [];
  let maxSteps = 0;
  for (const strategy of strategies) {
    const counts = blankCounts();
    byStrategy[strategy] = counts;
    for (let seed = 0; seed < seedCount; seed += 1) {
      const run = strategy === 'wander' || strategy === 'exhaustion'
        ? runSurvivalBot(seed, definition, strategy)
        : runRouteScenario(seed, SCENARIO_ROUTES[strategy], definition);
      assertGameState(run.state, definition);
      assertReplayEquivalent(run.state, definition);
      maxSteps = Math.max(maxSteps, run.steps);
      const softlock = run.state.status === 'active';
      for (const bucket of [counts, totals]) {
        bucket.runs += 1;
        bucket.wins += run.state.status === 'won' ? 1 : 0;
        bucket.losses += run.state.status === 'lost' ? 1 : 0;
        bucket.softlocks += softlock ? 1 : 0;
        bucket.rejectedCommands += run.rejectedCommands;
      }
      if (run.state.ending?.kind === 'defeat') {
        const reason = run.state.ending.reason;
        failureReasons[reason] = (failureReasons[reason] ?? 0) + 1;
      }
      if ((softlock || run.rejectedCommands > 0) && problemSamples.length < 20) {
        problemSamples.push({ seed, strategy, issue: softlock ? 'active-after-policy-finished-or-step-limit' : 'rejected-command' });
      }
    }
  }
  return { engineVersion: ENGINE_VERSION, contentVersion: definition.contentVersion,
    seeds: { from: 0, to: seedCount - 1, count: seedCount },
    totals, byStrategy, failureReasons, maxSteps, problemSamples, replayVerifiedRuns: totals.runs };
}

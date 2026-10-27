import { canonicalJson } from "./primitives";
import { processCommand } from "./processor";
import { createGame } from "./state";
import { commandRecordSchema } from "./state-schema";
import type { CommandRecord, GameState } from "./state-schema";
import type { WorldDefinition } from "../world/schema";

export class ReplayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReplayError";
  }
}

/** Replay verifies both state transitions and the recorded domain-event/RNG audit trail. */
export function replayLog(
  seed: number,
  records: readonly CommandRecord[],
  definition: WorldDefinition,
): GameState {
  let state = createGame(seed, definition);
  for (const raw of records) {
    const parsed = commandRecordSchema.safeParse(raw);
    if (!parsed.success)
      throw new ReplayError(`Invalid command record: ${parsed.error.message}`);
    const record = parsed.data;
    const result = processCommand(
      state,
      record.command,
      { principalId: record.principalId },
      definition,
    );
    if (!result.ok)
      throw new ReplayError(
        `Command ${record.sequence} rejected: ${result.error.code}`,
      );
    const actualRecord = result.state.commandLog.at(-1);
    if (canonicalJson(actualRecord) !== canonicalJson(record))
      throw new ReplayError(`Replay diverged at command ${record.sequence}`);
    state = result.state;
  }
  return state;
}

export function assertReplayEquivalent(
  state: GameState,
  definition: WorldDefinition,
): void {
  const replayed = replayLog(state.initialSeed, state.commandLog, definition);
  if (canonicalJson(replayed) !== canonicalJson(state))
    throw new ReplayError(
      "Saved snapshot differs from replayed command history.",
    );
}

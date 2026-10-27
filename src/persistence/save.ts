import { z } from 'zod';
import { assertGameState } from '../core/invariants';
import { ENGINE_VERSION } from '../core/primitives';
import { assertReplayEquivalent } from '../core/replay';
import { gameStateSchema } from '../core/state-schema';
import type { GameState } from '../core/state-schema';
import type { WorldDefinition } from '../world/schema';

export const SAVE_SCHEMA_VERSION = 3;
export const SAVE_FORMAT = 'last-convoy-save';
const MAX_SAVE_CHARACTERS = 10_000_000;
const saveSchema = z.object({
  format: z.literal(SAVE_FORMAT), schemaVersion: z.literal(SAVE_SCHEMA_VERSION),
  engineVersion: z.string(), contentVersion: z.string(), state: gameStateSchema,
}).strict();
// The initial development format stored only a version and a complete state.
const legacySaveSchema = z.object({ schemaVersion: z.literal(0), state: z.unknown() }).strict();

export type SaveErrorCode = 'INVALID_SAVE' | 'UNSUPPORTED_VERSION' | 'CONTENT_MISMATCH' | 'REPLAY_MISMATCH' | 'STORAGE_ERROR' | 'NOT_FOUND';
export class SaveError extends Error {
  constructor(readonly code: SaveErrorCode, message: string) { super(message); this.name = 'SaveError'; }
}

export function migrateSave(input: unknown): unknown {
  if (typeof input !== 'object' || input === null || !('schemaVersion' in input)) {
    throw new SaveError('INVALID_SAVE', 'Save envelope requires schemaVersion.');
  }
  if (input.schemaVersion === SAVE_SCHEMA_VERSION) return input;
  if ((input.schemaVersion === 1 || input.schemaVersion === 2) && 'state' in input) {
    const previous = input as Record<string, unknown>;
    const state = previous.state as Record<string, unknown>;
    if (!state || typeof state !== 'object') throw new SaveError('INVALID_SAVE', 'Invalid legacy state');
    return { ...previous, schemaVersion: SAVE_SCHEMA_VERSION, state: { ...state, schemaVersion: 3, campaign: state.campaign ?? null } };
  }
  if (input.schemaVersion !== 0) throw new SaveError('UNSUPPORTED_VERSION', `Unsupported save schema: ${String(input.schemaVersion)}`);
  const legacy = legacySaveSchema.safeParse(input);
  if (!legacy.success) throw new SaveError('INVALID_SAVE', legacy.error.message);
  const state = legacy.data.state as Record<string, unknown> | null;
  if (!state || typeof state !== 'object') throw new SaveError('INVALID_SAVE', 'Legacy save requires a state');
  return migrateSave({ format: SAVE_FORMAT, schemaVersion: 1,
    engineVersion: state.engineVersion, contentVersion: state.contentVersion, state });
}

export function serializeGame(state: GameState, definition: WorldDefinition): string {
  assertGameState(state, definition);
  assertReplayEquivalent(state, definition);
  return JSON.stringify({ format: SAVE_FORMAT, schemaVersion: SAVE_SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION, contentVersion: definition.contentVersion, state });
}

export function loadGame(serialized: string, definition: WorldDefinition): GameState {
  if (serialized.length > MAX_SAVE_CHARACTERS) throw new SaveError('INVALID_SAVE', 'Save exceeds the supported size.');
  let raw: unknown;
  try { raw = JSON.parse(serialized) as unknown; }
  catch { throw new SaveError('INVALID_SAVE', 'Save is not valid JSON.'); }
  const migrated = migrateSave(raw);
  if (typeof migrated === 'object' && migrated !== null && 'engineVersion' in migrated && migrated.engineVersion !== ENGINE_VERSION) {
    throw new SaveError('UNSUPPORTED_VERSION', 'Save requires a different engine version.');
  }
  const parsed = saveSchema.safeParse(migrated);
  if (!parsed.success) throw new SaveError('INVALID_SAVE', parsed.error.message);
  const save = parsed.data;
  if (save.contentVersion !== definition.contentVersion || save.state.contentVersion !== definition.contentVersion) {
    throw new SaveError('CONTENT_MISMATCH', 'Save requires the exact content version it was created with.');
  }
  try { assertGameState(save.state, definition); }
  catch (error) { throw new SaveError('INVALID_SAVE', error instanceof Error ? error.message : 'Invalid state'); }
  try { assertReplayEquivalent(save.state, definition); }
  catch (error) { throw new SaveError('REPLAY_MISMATCH', error instanceof Error ? error.message : 'Replay failed'); }
  return save.state;
}

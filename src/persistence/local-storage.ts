import { idSchema } from "../core/primitives";
import type { GameState } from "../core/state-schema";
import type { WorldDefinition } from "../world/schema";
import { loadGame, SaveError, serializeGame } from "./save";

/** Browser localStorage or an in-memory equivalent, injected so the core stays headless. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class LocalSaveStore {
  constructor(
    private readonly storage: KeyValueStorage,
    private readonly definition: WorldDefinition,
  ) {}

  private key(slot: string): string {
    return `last-convoy:slot:${idSchema.parse(slot)}`;
  }

  save(slot: string, state: GameState): void {
    const key = this.key(slot);
    const data = serializeGame(state, this.definition);
    try {
      this.storage.setItem(key, data);
    } catch {
      throw new SaveError(
        "STORAGE_ERROR",
        "Cannot write save slot. Check browser storage availability or quota.",
      );
    }
  }

  load(slot: string): GameState {
    const key = this.key(slot);
    let data: string | null;
    try {
      data = this.storage.getItem(key);
    } catch {
      throw new SaveError("STORAGE_ERROR", "Cannot read save slot.");
    }
    if (data === null)
      throw new SaveError("NOT_FOUND", `Save slot ${slot} does not exist.`);
    return loadGame(data, this.definition);
  }

  remove(slot: string): void {
    const key = this.key(slot);
    try {
      this.storage.removeItem(key);
    } catch {
      throw new SaveError("STORAGE_ERROR", "Cannot delete save slot.");
    }
  }
}

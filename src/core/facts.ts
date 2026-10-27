import type { GameState } from './state-schema';
import type { FactValue } from '../narrative/schema';

export function establishFact(state: GameState, id: string, value: FactValue, reveal = true): void {
  state.world.facts[id] = { value, establishedAt: state.world.tick };
  if (reveal && !state.knowledge.factIds.includes(id)) state.knowledge.factIds.push(id);
}

import { RESOURCE_IDS, emptyResources } from './primitives';
import type { Resources } from './primitives';
import type { ConvoyState, GameState } from './state-schema';
import type { WorldDefinition } from '../world/schema';

export function countActiveCrew(state: GameState, convoy: ConvoyState): number {
  return convoy.actorIds.filter((id) => state.actors[id]?.status === 'active').length;
}

/** Active/downed/captured living crew consume supplies; dead crew do not. */
export function supplyCosts(state: GameState, convoy: ConvoyState, ticks: number, definition: WorldDefinition): Resources {
  const livingCrew = convoy.actorIds.filter((id) => state.actors[id]?.status !== 'dead').length;
  return {
    ...emptyResources(),
    food: livingCrew * ticks * definition.rules.foodPerCrewPerTick,
    water: livingCrew * ticks * definition.rules.waterPerCrewPerTick,
  };
}

export function canAfford(resources: Resources, costs: Resources): boolean {
  return RESOURCE_IDS.every((id) => Number.isSafeInteger(costs[id]) && costs[id] >= 0 && resources[id] >= costs[id]);
}

export function subtractResources(resources: Resources, costs: Resources): Resources {
  if (!canAfford(resources, costs)) throw new Error('Resource transaction would produce an invalid balance.');
  return Object.fromEntries(RESOURCE_IDS.map((id) => [id, resources[id] - costs[id]])) as Resources;
}

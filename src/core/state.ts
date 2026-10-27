import { ENGINE_VERSION, STATE_SCHEMA_VERSION } from './primitives';
import { createRng } from './rng';
import type { GameState } from './state-schema';
import { validateWorldDefinition } from '../world/registry';
import type { WorldDefinition } from '../world/schema';

export function createGame(seed: number, input: WorldDefinition): GameState {
  const definition = validateWorldDefinition(input);
  const { start } = definition;
  const rng = createRng(seed);
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    contentVersion: definition.contentVersion,
    initialSeed: seed,
    rng,
    status: 'active',
    ending: null,
    player: { id: start.playerId, convoyId: start.convoyId },
    actors: Object.fromEntries(start.characterIds.map((id) => {
      const character = definition.characters.find((entry) => entry.id === id);
      if (!character) throw new Error(`Missing starting character: ${id}`);
      return [id, { ...character, convoyId: start.convoyId, health: character.maxHealth, status: 'active' as const }];
    })),
    convoys: {
      [start.convoyId]: {
        id: start.convoyId, controllerId: start.playerId, locationId: start.locationId,
        actorIds: [...start.characterIds],
        resources: { ...start.resources },
        vehicle: { ...start.vehicle, condition: start.vehicle.maxCondition },
      },
    },
    world: {
      tick: 0,
      locations: Object.fromEntries(definition.locations.map((location) => [location.id, {
        id: location.id, accessible: true, visits: location.id === start.locationId ? 1 : 0,
      }])),
      routes: Object.fromEntries(definition.routes.map((route) => [route.id, { id: route.id, accessible: true, traversals: 0 }])),
      facts: {},
      npcs: {},
    },
    inventory: { artifactInstances: {} },
    knowledge: { locationIds: [start.locationId], factIds: [] },
    activeEvents: [],
    activeQuests: [],
    combat: null,
    eventSequence: 0,
    commandLog: [],
  };
}

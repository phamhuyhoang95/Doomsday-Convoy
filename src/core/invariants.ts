import { canonicalJson } from './primitives';
import { canAfford, countActiveCrew, supplyCosts } from './resources';
import { gameStateSchema } from './state-schema';
import type { GameState } from './state-schema';
import type { WorldDefinition } from '../world/schema';

function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Invalid game state: ${message}`);
}

function sameIds(actual: string[], expected: string[]): boolean {
  return canonicalJson([...actual].sort()) === canonicalJson([...expected].sort());
}

/** Structural and cross-reference checks. Full historical verification is performed by replay on load. */
export function assertGameState(state: GameState, definition: WorldDefinition): void {
  gameStateSchema.parse(state);
  ensure(state.contentVersion === definition.contentVersion, 'content version mismatch');
  ensure(state.rng.seed === state.initialSeed, 'RNG seed differs from initial seed');
  ensure(state.player.id === definition.start.playerId && state.player.convoyId === definition.start.convoyId, 'unknown player');
  ensure(sameIds(Object.keys(state.convoys), [definition.start.convoyId]), 'unexpected convoy set for Phase 1');
  if (!definition.campaign) ensure(sameIds(Object.keys(state.actors), definition.start.characterIds), 'unexpected actor set');
  else ensure(Object.keys(state.actors).every((id) => definition.characters.some((entry) => entry.id === id)), 'unknown actor');
  ensure(sameIds(Object.keys(state.world.locations), definition.locations.map((entry) => entry.id)), 'location registry mismatch');
  ensure(sameIds(Object.keys(state.world.routes), definition.routes.map((entry) => entry.id)), 'route registry mismatch');
  for (const [id, location] of Object.entries(state.world.locations)) ensure(id === location.id, 'location key mismatch');
  for (const [id, route] of Object.entries(state.world.routes)) ensure(id === route.id, 'route key mismatch');
  for (const [id, convoy] of Object.entries(state.convoys)) {
    ensure(convoy.id === id, 'convoy key mismatch');
    ensure(convoy.controllerId === state.player.id, 'unknown controller');
    ensure(Object.hasOwn(state.world.locations, convoy.locationId), 'unknown convoy location');
    if (!definition.campaign) ensure(sameIds(convoy.actorIds, definition.start.characterIds), 'crew membership mismatch');
    ensure(new Set(convoy.actorIds).size === convoy.actorIds.length, 'duplicate crew membership');
    ensure(convoy.vehicle.id === definition.start.vehicle.id, 'unknown vehicle');
    ensure(convoy.vehicle.maxCondition === definition.start.vehicle.maxCondition, 'vehicle maximum mismatch');
    ensure(convoy.vehicle.condition <= convoy.vehicle.maxCondition, 'vehicle exceeds maximum condition');
    for (const actorId of convoy.actorIds) {
      const actor = state.actors[actorId];
      const character = definition.characters.find((entry) => entry.id === actorId);
      ensure(actor && character, 'missing crew member');
      ensure(actor.id === actorId && actor.convoyId === id, 'actor ownership mismatch');
      ensure(actor.maxHealth === character.maxHealth && actor.health <= actor.maxHealth, 'invalid actor health');
      ensure(actor.status !== 'active' || actor.health > 0, 'active actor has no health');
      ensure(actor.status !== 'dead' || actor.health === 0, 'dead actor has health');
    }
  }
  ensure(new Set(state.knowledge.locationIds).size === state.knowledge.locationIds.length, 'duplicate discovered location');
  ensure(new Set(state.knowledge.factIds).size === state.knowledge.factIds.length, 'duplicate known fact');
  state.knowledge.locationIds.forEach((id) => ensure(Object.hasOwn(state.world.locations, id), 'knowledge references unknown location'));
  state.knowledge.factIds.forEach((id) => ensure(Object.hasOwn(state.world.facts, id), 'knowledge references missing fact'));
  Object.values(state.world.facts).forEach((fact) => ensure(fact.establishedAt <= state.world.tick, 'fact comes from the future'));
  ensure(Boolean(state.campaign) === Boolean(definition.campaign), 'campaign mode mismatch');
  if (definition.campaign) {
    ensure(state.campaign?.id === definition.campaign.id, 'campaign ID mismatch');
    const definitions = definition.campaign;
    ensure(Object.values(state.inventory.artifactInstances).length === definitions.artifacts.length, 'artifact instance count mismatch');
    const ownedIds = new Set<string>();
    for (const [id, instance] of Object.entries(state.inventory.artifactInstances)) {
      ensure(id === instance.id && !ownedIds.has(instance.artifactId), 'duplicate artifact instance');
      ownedIds.add(instance.artifactId);
      ensure(definitions.artifacts.some((entry) => entry.id === instance.artifactId), 'unknown artifact');
      ensure(Object.hasOwn(state.convoys, instance.ownerId) || Object.hasOwn(state.world.locations, instance.ownerId), 'unknown artifact owner');
    }
    for (const event of state.activeEvents) ensure(definitions.events.some((entry) => entry.id === event.eventId && entry.version === event.version), 'unknown event');
    ensure(new Set(state.activeQuests.map((quest) => quest.id)).size === state.activeQuests.length, 'duplicate quest');
    for (const quest of state.activeQuests) ensure(definitions.quests.some((entry) => entry.id === quest.templateId), 'unknown quest');
  }

  let tick = 0;
  let eventCount = 0;
  let rng = { ...state.rng, state: state.initialSeed, draws: 0 };
  const commandIds = new Set<string>();
  for (const [index, record] of state.commandLog.entries()) {
    ensure(record.sequence === index + 1 && !commandIds.has(record.command.id), 'invalid command sequence or duplicate ID');
    commandIds.add(record.command.id);
    ensure(record.tickBefore === tick && record.tickAfter > tick, 'non-contiguous command ticks');
    ensure(record.principalId === record.command.issuerId, 'log principal mismatch');
    ensure(canonicalJson(record.rngBefore) === canonicalJson(rng), 'RNG log chain mismatch');
    ensure(record.rngAfter.seed === state.initialSeed && record.rngAfter.draws >= rng.draws, 'invalid RNG transition');
    for (const event of record.events) {
      eventCount += 1;
      ensure(event.id === `event.${eventCount}`, 'invalid event sequence');
      ensure(event.tick >= record.tickBefore && event.tick <= record.tickAfter, 'event tick outside command');
    }
    tick = record.tickAfter;
    rng = record.rngAfter;
  }
  ensure(tick === state.world.tick && eventCount === state.eventSequence, 'state/log counters differ');
  ensure(canonicalJson(rng) === canonicalJson(state.rng), 'final RNG differs from log');

  const convoy = state.convoys[state.player.convoyId];
  ensure(convoy, 'missing player convoy');
  if (state.status === 'active') {
    ensure(state.ending === null, 'active game has an ending');
    ensure(convoy.vehicle.condition > 0 && countActiveCrew(state, convoy) > 0, 'active convoy cannot operate');
    ensure(canAfford(convoy.resources, supplyCosts(state, convoy, 1, definition)), 'active convoy has exhausted supplies');
    ensure(!definition.goal.locationIds.includes(convoy.locationId), 'active convoy is already at the goal');
  } else {
    ensure(state.ending?.tick === state.world.tick, 'ending tick mismatch');
    if (state.status === 'won') {
      ensure(state.ending?.kind === 'victory' && state.ending.id === definition.goal.endingId, 'victory ending mismatch');
      ensure(state.ending.locationId === convoy.locationId && definition.goal.locationIds.includes(convoy.locationId), 'victory outside goal');
      ensure(convoy.vehicle.condition > 0, 'destroyed convoy cannot win');
    } else {
      ensure(state.ending?.kind === 'defeat', 'defeat ending mismatch');
      const reason = state.ending.reason;
      ensure(reason !== 'vehicle-destroyed' || convoy.vehicle.condition === 0, 'vehicle defeat without destruction');
      ensure(reason !== 'no-active-crew' || countActiveCrew(state, convoy) === 0, 'crew defeat with active crew');
      ensure(reason !== 'supplies-exhausted' || !canAfford(convoy.resources, supplyCosts(state, convoy, 1, definition)), 'supply defeat with supplies');
    }
  }
}

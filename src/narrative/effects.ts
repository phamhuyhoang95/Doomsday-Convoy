import { CommandError } from '../core/commands';
import type { DomainEventPayload } from '../core/events';
import type { GameState } from '../core/state-schema';
import type { WorldDefinition } from '../world/schema';
import type { Effect } from './schema';

export type Emit = (payload: DomainEventPayload) => void;
/** Called only on the command transaction's cloned state, never directly from content/UI. */
export function applyEffects(state: GameState, effects: readonly Effect[], definition: WorldDefinition, emit: Emit): void {
  const convoy = state.convoys[state.player.convoyId];
  if (!convoy) throw new Error('Missing player convoy');
  for (const effect of effects) {
    switch (effect.op) {
      case 'resource':
        if (convoy.resources[effect.resource] + effect.amount > 1_000_000) throw new CommandError('INVALID_COMMAND', 'Resource cap exceeded');
        convoy.resources[effect.resource] += effect.amount; break;
      case 'fact':
        state.world.facts[effect.id] = { value: effect.value, establishedAt: state.world.tick };
        if (effect.reveal && !state.knowledge.factIds.includes(effect.id)) state.knowledge.factIds.push(effect.id);
        break;
      case 'knowledge':
        if (!Object.hasOwn(state.world.facts, effect.id)) throw new CommandError('REQUIREMENTS_NOT_MET', 'Fact has not been established');
        if (!state.knowledge.factIds.includes(effect.id)) state.knowledge.factIds.push(effect.id);
        break;
      case 'artifact': {
        const instance = Object.values(state.inventory.artifactInstances).find((entry) => entry.artifactId === effect.artifactId);
        if (!instance || instance.ownerId !== effect.fromOwnerId) throw new CommandError('REQUIREMENTS_NOT_MET', 'Artifact ownership changed');
        instance.ownerId = effect.toOwnerId;
        emit({ type: 'artifact.transferred', artifactId: effect.artifactId, fromOwnerId: effect.fromOwnerId, toOwnerId: effect.toOwnerId });
        break;
      }
      case 'rescue': {
        if (state.actors[effect.actorId]) throw new CommandError('REQUIREMENTS_NOT_MET', 'Survivor has already joined');
        const character = definition.characters.find((entry) => entry.id === effect.actorId);
        if (!character) throw new Error('Unknown rescue character');
        state.actors[effect.actorId] = { ...character, convoyId: convoy.id, health: character.maxHealth, status: 'active' };
        convoy.actorIds.push(effect.actorId); break;
      }
      case 'damage':
        if (effect.target === 'vehicle') convoy.vehicle.condition = Math.max(0, convoy.vehicle.condition - effect.amount);
        else convoy.actorIds.forEach((id) => {
          const actor = state.actors[id];
          if (actor && actor.status !== 'dead') { actor.health = Math.max(0, actor.health - effect.amount); if (actor.health === 0) actor.status = 'downed'; }
        });
        break;
      case 'repair': convoy.vehicle.condition = Math.min(convoy.vehicle.maxCondition, convoy.vehicle.condition + effect.amount); break;
      case 'location': {
        const location = state.world.locations[effect.locationId];
        if (!location) throw new Error('Unknown effect location');
        location.accessible = effect.accessible; break;
      }
      case 'actor': {
        const actor = state.actors[effect.actorId];
        if (!actor) throw new CommandError('REQUIREMENTS_NOT_MET', 'Actor is absent');
        actor.status = effect.status;
        if (effect.status === 'dead' || effect.status === 'downed') actor.health = 0;
        if (effect.status === 'active') actor.health = Math.max(1, actor.health);
        break;
      }
    }
  }
}

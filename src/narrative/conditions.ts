import type { GameState } from '../core/state-schema';
import type { Condition } from './schema';

export function evaluateCondition(state: GameState, condition: Condition): boolean {
  const convoy = state.convoys[state.player.convoyId];
  switch (condition.op) {
    case 'always': return true;
    case 'all': return condition.conditions.every((item) => evaluateCondition(state, item));
    case 'any': return condition.conditions.some((item) => evaluateCondition(state, item));
    case 'not': return !evaluateCondition(state, condition.condition);
    case 'fact': return state.world.facts[condition.id]?.value === condition.value;
    case 'known': return state.knowledge.factIds.includes(condition.id);
    case 'resource': return convoy !== undefined && convoy.resources[condition.resource] >= condition.atLeast;
    case 'at': return convoy?.locationId === condition.locationId;
    case 'owns': return Object.values(state.inventory.artifactInstances).some((artifact) => artifact.artifactId === condition.artifactId && artifact.ownerId === condition.ownerId);
    case 'actor': return state.actors[condition.actorId]?.status === condition.status;
    case 'location': return state.world.locations[condition.locationId]?.accessible === condition.accessible;
    case 'quest': return state.activeQuests.some((quest) => quest.templateId === condition.questId && quest.status === condition.status);
  }
}

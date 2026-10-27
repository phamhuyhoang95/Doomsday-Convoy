import { CommandError } from '../core/commands';
import { canAfford, subtractResources } from '../core/resources';
import { nextInt } from '../core/rng';
import type { GameState } from '../core/state-schema';
import type { WorldDefinition } from '../world/schema';
import { evaluateCondition } from './conditions';
import { applyEffects } from './effects';
import type { Emit } from './effects';
import { updateQuests } from './quests';

export function eventEligibility(state: GameState, definition: WorldDefinition) {
  const locationId = state.convoys[state.player.convoyId]?.locationId;
  return (definition.campaign?.events ?? []).map((event) => ({
    event,
    locationMatches: event.locationIds.includes(locationId ?? ''),
    triggerMatches: evaluateCondition(state, event.trigger),
    occurrencesRemain: (state.campaign?.eventCounts[event.id] ?? 0) < event.spawn.maxOccurrences,
  }));
}

export function refreshNarrative(state: GameState, definition: WorldDefinition, emit: Emit): void {
  if (!state.campaign || !definition.campaign) return;
  updateQuests(state, definition, emit);
  const candidate = eventEligibility(state, definition).filter((entry) => entry.locationMatches && entry.triggerMatches && entry.occurrencesRemain)
    .sort((a, b) => {
      const score = (id: string, priority: number) => priority + (state.campaign?.pendingHooks.includes(id) ? 10000 : 0);
      return score(b.event.id, b.event.spawn.priority) - score(a.event.id, a.event.spawn.priority) || a.event.id.localeCompare(b.event.id, 'en');
    })[0]?.event;
  const locationId = state.convoys[state.player.convoyId]?.locationId;
  state.activeEvents = candidate && locationId ? [{ instanceId: `${candidate.id}.${(state.campaign.eventCounts[candidate.id] ?? 0) + 1}`,
    eventId: candidate.id, version: candidate.version, locationId }] : [];
}

export function resolveChoice(state: GameState, instanceId: string, choiceId: string, definition: WorldDefinition, emit: Emit): void {
  const instance = state.activeEvents.find((entry) => entry.instanceId === instanceId);
  const event = definition.campaign?.events.find((entry) => entry.id === instance?.eventId);
  const convoy = state.convoys[state.player.convoyId];
  if (!state.campaign || !instance || !event || !convoy || instance.locationId !== convoy.locationId) throw new CommandError('NO_ACTIVE_EVENT', 'Event is no longer active here.');
  const choice = event.choices.find((entry) => entry.id === choiceId);
  if (!choice || !evaluateCondition(state, choice.requirements)) throw new CommandError('REQUIREMENTS_NOT_MET', 'Choice requirements are not met.');
  if (!canAfford(convoy.resources, choice.costs)) throw new CommandError('INSUFFICIENT_RESOURCES', 'Cannot pay event costs.');
  convoy.resources = subtractResources(convoy.resources, choice.costs);
  emit({ type: 'resources.consumed', convoyId: convoy.id, costs: choice.costs, reason: 'event' });
  const total = choice.outcomes.reduce((sum, outcome) => sum + outcome.weight, 0);
  const draw = nextInt(state.rng, total); state.rng = draw.rng;
  let cursor = draw.value;
  const outcome = choice.outcomes.find((entry) => { cursor -= entry.weight; return cursor < 0; });
  if (!outcome) throw new Error('Invalid event outcome weights');
  applyEffects(state, outcome.effects, definition, emit);
  state.campaign.eventCounts[event.id] = (state.campaign.eventCounts[event.id] ?? 0) + 1;
  state.campaign.pendingHooks = [...new Set([...state.campaign.pendingHooks.filter((id) => id !== event.id), ...outcome.hooks])];
  state.campaign.lastOutcomeKey = outcome.textKey;
  state.activeEvents = [];
  emit({ type: 'event.resolved', eventId: event.id, choiceId: choice.id, outcomeKey: outcome.textKey });
}

import { emptyResources } from '../core/primitives';
import type { Resources } from '../core/primitives';
import type { Condition, Effect, EventDefinition, QuestDefinition } from '../narrative/schema';

export const always: Condition = { op: 'always' };
export const never: Condition = { op: 'not', condition: always };
export const fact = (id: string, value: boolean | number | string = true): Condition => ({ op: 'fact', id, value });
export const all = (...conditions: Condition[]): Condition => ({ op: 'all', conditions });
export const any = (...conditions: Condition[]): Condition => ({ op: 'any', conditions });
export const not = (condition: Condition): Condition => ({ op: 'not', condition });
export const known = (id: string): Condition => ({ op: 'known', id });
export const owns = (artifactId: string, ownerId = 'convoy.player'): Condition => ({ op: 'owns', artifactId, ownerId });
export const setFact = (id: string, value: boolean | string | number = true, reveal = true): Effect => ({ op: 'fact', id, value, reveal });
export const reward = (resource: keyof Resources, amount: number): Effect => ({ op: 'resource', resource, amount });
export function choice(id: string, effects: Effect[], requirements: Condition = always, costs: Partial<Resources> = {}): EventDefinition['choices'][number] {
  return { id, labelKey: `choice.${id}`, requirements, costs: { ...emptyResources(), ...costs }, outcomes: [{ weight: 1, textKey: `outcome.${id}`, effects, hooks: [] }] };
}
export function event(id: string, locationId: string, choices: EventDefinition['choices'], trigger: Condition = always, priority = 10): EventDefinition {
  return { id: `event.${id}`, version: 1, tags: ['campaign'], locationIds: [locationId], trigger, spawn: { maxOccurrences: 1, priority }, titleKey: `event.${id}.title`, textKey: `event.${id}.text`, choices };
}
export function quest(id: string, successWhen: Condition, alternateWhen: Condition, onAlternate: Effect[] = []): QuestDefinition {
  return { id: `quest.${id}`, version: 1, titleKey: `quest.${id}.title`, descriptionKey: `quest.${id}.text`, preconditions: always,
    dependencies: [], objectives: [{ id: `objective.${id}`, textKey: `quest.${id}.objective`, when: successWhen }],
    successWhen, failureWhen: never, alternateWhen, onSuccess: [], onFailure: [], onAlternate };
}

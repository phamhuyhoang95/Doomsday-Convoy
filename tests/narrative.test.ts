import { describe, expect, it } from 'vitest';
import { campaignDefinition } from '../src/content/campaign';
import { choice, event, setFact } from '../src/content/builders';
import { processCommand } from '../src/core/processor';
import { createGame } from '../src/core/state';
import type { GameCommand } from '../src/core/commands';
import type { GameState } from '../src/core/state-schema';
import { evaluateCondition } from '../src/narrative/conditions';
import { loadGame, serializeGame } from '../src/persistence/save';
import { travelCommand } from '../src/simulation/scenarios';
import { validateWorldDefinition } from '../src/world/registry';

const def = campaignDefinition;
function choose(state: GameState, id: string): GameCommand {
  const active = state.activeEvents[0]; if (!active) throw new Error('No event');
  return { id: `command.${state.commandLog.length + 1}`, issuerId: state.player.id,
    payload: { type: 'choose', convoyId: state.player.convoyId, instanceId: active.instanceId, choiceId: id } };
}
function take(state: GameState, command: GameCommand, definition = def): GameState {
  const result = processCommand(state, command, { principalId: state.player.id }, definition);
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`); return result.state;
}

describe('data event and story contracts', () => {
  it('keeps objective facts separate from discovered knowledge', () => {
    const state = createGame(42, def);
    state.world.facts['hospital.rule'] = { value: true, establishedAt: 0 };
    expect(evaluateCondition(state, { op: 'fact', id: 'hospital.rule', value: true })).toBe(true);
    expect(evaluateCondition(state, { op: 'known', id: 'hospital.rule' })).toBe(false);
    expect(evaluateCondition(state, { op: 'not', condition: { op: 'resource', resource: 'fuel', atLeast: 1000 } })).toBe(true);
  });
  it('resolves events, world facts, ownership and contracts through commands', () => {
    let state = createGame(42, def);
    state = take(state, choose(state, 'prepare'));
    state = take(state, travelCommand(state, 'route.garage-market'));
    state = take(state, travelCommand(state, 'route.market-hospital'));
    state = take(state, choose(state, 'listen'));
    state = take(state, travelCommand(state, 'route.hospital-ward'));
    state = take(state, choose(state, 'bind-mirror'));
    expect(evaluateCondition(state, { op: 'owns', artifactId: 'artifact.mirror', ownerId: 'convoy.player' })).toBe(true);
    state = loadGame(serializeGame(state, def), def);
    state = take(state, travelCommand(state, 'route.ward-checkpoint'));
    state = take(state, choose(state, 'signal-passage'));
    state = take(state, travelCommand(state, 'route.checkpoint-refuge'));
    expect(state.status).toBe('won');
    expect(state.activeQuests.every((quest) => quest.status !== 'active')).toBe(true);
  });
  it('supports data-only alternate resolution after location closure and NPC death fact', () => {
    const custom = structuredClone(def); const content = custom.campaign!;
    content.events.push(event('fallback-proof', 'location.garage', [choice('fallback-proof', [
      { op: 'location', locationId: 'location.ward', accessible: false },
      { op: 'artifact', artifactId: 'artifact.lantern', fromOwnerId: 'location.service', toOwnerId: 'convoy.player' },
      setFact('rival.dead'), setFact('story.departed'),
    ])], { op: 'always' }, 999));
    for (const key of ['event.fallback-proof.title', 'event.fallback-proof.text', 'choice.fallback-proof', 'outcome.fallback-proof']) content.texts[key] = 'Fallback';
    const validated = validateWorldDefinition(custom);
    let state = createGame(42, validated); state = take(state, choose(state, 'fallback-proof'), validated);
    expect(state.activeQuests.find((quest) => quest.templateId === 'quest.hospital')?.status).toBe('alternative');
    expect(state.activeQuests.find((quest) => quest.templateId === 'quest.rival')?.status).toBe('alternative');
    expect(state.world.facts['hospital.resolved']?.value).toBe(true);
  });
  it('refuses stale event commands and unmet requirements atomically', () => {
    const state = createGame(42, def); const command = choose(state, 'prepare');
    const next = take(state, command);
    const stale = { ...command, id: 'command.stale' };
    const result = processCommand(next, stale, { principalId: next.player.id }, def);
    expect(result.ok ? null : result.error.code).toBe('NO_ACTIVE_EVENT'); expect(result.state).toBe(next);
  });
  it.each(['weights', 'reference', 'hook', 'cycle', 'fallback', 'operator'])('validates %s content errors', (kind) => {
    const custom = structuredClone(def); const content = custom.campaign!;
    if (kind === 'weights') content.events[0]!.choices[0]!.outcomes[0]!.weight = 0;
    if (kind === 'reference') content.events[0]!.trigger = { op: 'known', id: 'unknown.fact' };
    if (kind === 'hook') content.events[0]!.choices[0]!.outcomes[0]!.hooks.push('event.missing');
    if (kind === 'cycle') content.quests[0]!.dependencies = [content.quests[0]!.id];
    if (kind === 'fallback') content.events[0]!.choices.forEach((entry) => { entry.costs.food = 2; });
    if (kind === 'operator') Object.assign(content.events[0]!.trigger, { op: 'eval', code: 'globalThis.hacked=true' });
    expect(() => validateWorldDefinition(custom)).toThrow();
  });
});

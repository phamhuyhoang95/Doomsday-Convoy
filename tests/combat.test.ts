import { describe, expect, it } from 'vitest';
import { campaignDefinition } from '../src/content/campaign';
import { currentCombatActor } from '../src/combat/engine';
import { processCommand } from '../src/core/processor';
import { createGame } from '../src/core/state';
import type { GameCommand } from '../src/core/commands';
import type { GameState } from '../src/core/state-schema';
import { loadGame, serializeGame } from '../src/persistence/save';
import { playCampaign, campaignChoice, battleCommand } from '../src/simulation/campaign';
import { travelCommand, waitCommand } from '../src/simulation/scenarios';

const def = campaignDefinition;
function take(state: GameState, command: GameCommand): GameState {
  const result = processCommand(state, command, { principalId: state.player.id }, def);
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`); return result.state;
}
function atHospital(): GameState {
  let state = createGame(42, def);
  state = take(state, campaignChoice(state, 'prepare'));
  state = take(state, travelCommand(state, 'route.garage-market'));
  return take(state, travelCommand(state, 'route.market-hospital'));
}
function inBattle(): GameState {
  let state = atHospital(); state = take(state, campaignChoice(state, 'listen'));
  state = take(state, travelCommand(state, 'route.hospital-ward'));
  state = take(state, campaignChoice(state, 'bind-mirror'));
  state = take(state, travelCommand(state, 'route.ward-checkpoint'));
  return take(state, campaignChoice(state, 'fight'));
}

describe('combat, skills, NPC and artifact gameplay', () => {
  it.each(['peaceful', 'combat', 'trade', 'surrender', 'fallback'] as const)('finishes %s policy and survives replay/save', (policy) => {
    const run = playCampaign(42, policy, def);
    expect(run.issue).toBe(null); expect(run.state.status).toBe('won');
    expect(loadGame(serializeGame(run.state, def), def)).toEqual(run.state);
    if (policy === 'trade' || policy === 'surrender') expect(Object.values(run.state.inventory.artifactInstances).find((artifact) => artifact.artifactId === 'artifact.mirror')?.ownerId).toBe('convoy.rival');
    if (policy === 'combat') {
      expect(run.state.actors['character.raven']?.status).toBe('captured');
      expect(run.state.actors['character.ash']?.status).toBe('captured');
      expect(run.state.convoys['convoy.rival']?.resources.fuel).toBe(0);
    }
  });
  it('locks travel in combat, enforces turn ownership and enemy targeting', () => {
    const state = inBattle();
    const travel = processCommand(state, travelCommand(state, 'route.checkpoint-refuge'), { principalId: state.player.id }, def);
    expect(travel.ok ? null : travel.error.code).toBe('COMBAT_ACTIVE'); expect(travel.state).toBe(state);
    const command = battleCommand(state, 'attack', 'character.raven');
    if (command.payload.type !== 'combat') throw new Error('wrong command'); command.payload.actorId = 'character.lan';
    const wrongTurn = processCommand(state, command, { principalId: state.player.id }, def);
    expect(wrongTurn.ok ? null : wrongTurn.error.code).toBe('NOT_YOUR_TURN');
    const friendly = processCommand(state, battleCommand(state, 'attack', 'character.lan'), { principalId: state.player.id }, def);
    expect(friendly.ok ? null : friendly.error.code).toBe('INVALID_TARGET');
  });
  it('defends, runs enemy turns, and heals with a medicine cost', () => {
    let state = inBattle();
    for (let i = 0; i < 3; i += 1) state = take(state, battleCommand(state, 'defend'));
    expect(state.combat?.round).toBe(2);
    const before = state.actors['character.lan']!.health;
    expect(before).toBeLessThan(state.actors['character.lan']!.maxHealth);
    state = take(state, battleCommand(state, 'defend'));
    expect(currentCombatActor(state)?.id).toBe('character.lan');
    const medicine = state.convoys[state.player.convoyId]!.resources.medicine;
    state = take(state, { id: `command.${state.commandLog.length + 1}`, issuerId: state.player.id,
      payload: { type: 'use-skill', convoyId: state.player.convoyId, actorId: 'character.lan', skillId: 'skill.heal', targetId: 'character.lan' } });
    expect(state.actors['character.lan']!.health).toBeGreaterThan(before);
    expect(state.convoys[state.player.convoyId]!.resources.medicine).toBe(medicine - 1);
  });
  it('exploration skill consumes energy and has a real cooldown', () => {
    let state = atHospital(); expect(state.knowledge.factIds).not.toContain('hospital.rule');
    const skill = (s: GameState): GameCommand => ({ id: `command.${s.commandLog.length + 1}`, issuerId: s.player.id,
      payload: { type: 'use-skill', convoyId: s.player.convoyId, actorId: 'character.lan', skillId: 'skill.sense' } });
    state = take(state, skill(state));
    expect(state.knowledge.factIds).toContain('hospital.rule'); expect(state.actors['character.lan']?.energy).toBe(4);
    const result = processCommand(state, skill(state), { principalId: state.player.id }, def);
    expect(result.ok ? null : result.error.code).toBe('SKILL_UNAVAILABLE'); expect(result.state).toBe(state);
  });
  it('applies anomaly rule consequences through registered data', () => {
    const state = atHospital(); const safe = take(state, campaignChoice(state, 'listen'));
    const unsafe = take(state, campaignChoice(state, 'ignore-bell'));
    expect(unsafe.actors['character.minh']!.health).toBe(safe.actors['character.minh']!.health - 12);
  });
  it('negotiates from combat when evidence is known', () => {
    const state = take(inBattle(), battleCommand(inBattle(), 'negotiate'));
    expect(state.combat).toBe(null); expect(state.world.facts['rival.peaceful']?.value).toBe(true);
  });
  it('cannot capture a standing enemy', () => {
    const state = inBattle(); const result = processCommand(state, battleCommand(state, 'capture', 'character.raven'), { principalId: state.player.id }, def);
    expect(result.ok ? null : result.error.code).toBe('INVALID_TARGET'); expect(result.state).toBe(state);
  });
  it('round trips a battle mid-turn and continues with identical effects', () => {
    const state = inBattle(); const restored = loadGame(serializeGame(state, def), def);
    expect(take(restored, battleCommand(restored, 'attack', 'character.raven'))).toEqual(take(state, battleCommand(state, 'attack', 'character.raven')));
  });
  it('retreat spends fuel and either escapes or advances the combat turn', () => {
    const state = inBattle(); const beforeFuel = state.convoys[state.player.convoyId]!.resources.fuel;
    const result = take(state, battleCommand(state, 'retreat'));
    expect(result.convoys[state.player.convoyId]!.resources.fuel).toBe(beforeFuel - 2);
    expect(result.combat === null || currentCombatActor(result)?.id !== currentCombatActor(state)?.id).toBe(true);
    expect(loadGame(serializeGame(result, def), def)).toEqual(result);
  });
  it('NPC seeks and takes the physical artifact after the deadline', () => {
    let state = createGame(42, def); state = take(state, campaignChoice(state, 'prepare'));
    for (const ticks of [12, 12, 4]) state = take(state, waitCommand(state, ticks));
    expect(state.world.npcs['convoy.rival']?.intent).not.toBe('guard');
    expect(Object.values(state.inventory.artifactInstances).find((artifact) => artifact.artifactId === 'artifact.mirror')?.ownerId).toBe('convoy.rival');
    expect(loadGame(serializeGame(state, def), def)).toEqual(state);
  });
});

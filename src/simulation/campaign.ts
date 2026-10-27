import { currentCombatActor } from '../combat/engine';
import type { GameCommand } from '../core/commands';
import { processCommand } from '../core/processor';
import { canAfford, supplyCosts } from '../core/resources';
import { createGame } from '../core/state';
import type { GameState } from '../core/state-schema';
import { evaluateCondition } from '../narrative/conditions';
import { availableRoutes } from '../world/travel';
import type { WorldDefinition } from '../world/schema';
import { travelCommand, waitCommand } from './scenarios';

export type CampaignPolicy = 'peaceful' | 'combat' | 'trade' | 'surrender' | 'fallback';
export function campaignChoice(state: GameState, choiceId: string): GameCommand {
  const instance = state.activeEvents[0]; if (!instance) throw new Error('No active event');
  return { id: `command.${state.commandLog.length + 1}`, issuerId: state.player.id,
    payload: { type: 'choose', convoyId: state.player.convoyId, instanceId: instance.instanceId, choiceId } };
}
export function battleCommand(state: GameState, action: Extract<GameCommand['payload'], { type: 'combat' }>['action'], targetId?: string): GameCommand {
  const actor = currentCombatActor(state); if (!actor) throw new Error('No combat actor');
  return { id: `command.${state.commandLog.length + 1}`, issuerId: state.player.id,
    payload: { type: 'combat', convoyId: state.player.convoyId, actorId: actor.id, action, ...(targetId ? { targetId } : {}) } };
}

function combatBot(state: GameState, definition: WorldDefinition, policy: CampaignPolicy): GameCommand {
  const combat = state.combat; const actor = currentCombatActor(state);
  if (!combat || !actor) throw new Error('Missing combat');
  const enemies = Object.values(state.actors).filter((entry) => entry.convoyId === combat.enemyConvoyId);
  if (combat.phase === 'aftermath') {
    const downed = enemies.find((entry) => entry.status === 'downed');
    return downed ? battleCommand(state, 'capture', downed.id) : battleCommand(state, 'finish');
  }
  if (policy === 'surrender') return battleCommand(state, 'surrender');
  const target = enemies.filter((entry) => entry.status === 'active').sort((a, b) => a.health - b.health)[0];
  if (!target) throw new Error('Missing enemy');
  const skill = definition.campaign?.skills.find((entry) => entry.effect === 'damage' && actor.skillIds?.includes(entry.id)
    && (actor.energy ?? 0) >= entry.energyCost && (actor.cooldowns?.[entry.id] ?? 0) <= state.world.tick + 1);
  if (skill) return { id: `command.${state.commandLog.length + 1}`, issuerId: state.player.id,
    payload: { type: 'use-skill', convoyId: state.player.convoyId, actorId: actor.id, skillId: skill.id, targetId: target.id } };
  return battleCommand(state, 'attack', target.id);
}

function distance(from: string, to: string, definition: WorldDefinition, visited = new Set<string>()): number {
  if (from === to) return 0;
  if (visited.has(from)) return Infinity;
  const nextVisited = new Set(visited); nextVisited.add(from);
  return Math.min(Infinity, ...definition.routes.flatMap((route) => {
    const next = route.from === from ? route.to : route.bidirectional && route.to === from ? route.from : null;
    return next ? [route.travelTicks + distance(next, to, definition, nextVisited)] : [];
  }));
}

/** Plays actual commands; a failure to finish is reported, never replaced by a synthetic ending. */
export function playCampaign(seed: number, policy: CampaignPolicy, definition: WorldDefinition) {
  let state = createGame(seed, definition);
  let steps = 0;
  for (; state.status === 'active' && steps < 100; steps += 1) {
    let command: GameCommand;
    if (state.combat) command = combatBot(state, definition, policy);
    else if (state.activeEvents[0]) {
      const event = definition.campaign?.events.find((entry) => entry.id === state.activeEvents[0]?.eventId);
      const convoy = state.convoys[state.player.convoyId]; if (!event || !convoy) throw new Error('Missing event');
      const supplies = supplyCosts(state, convoy, 1, definition);
      const eligible = event.choices.filter((choice) => evaluateCondition(state, choice.requirements)
        && canAfford(convoy.resources, { food: supplies.food + choice.costs.food, water: supplies.water + choice.costs.water,
          fuel: choice.costs.fuel, medicine: choice.costs.medicine, scrap: choice.costs.scrap }));
      const preferred = policy === 'combat' || policy === 'surrender' ? ['fight', 'prepare', 'listen', 'bind-mirror']
        : policy === 'trade' ? ['trade-mirror', 'prepare', 'listen', 'bind-mirror']
        : policy === 'fallback' ? ['seal-ward', 'yield-passage', 'prepare', 'listen']
        : ['signal-passage', 'prepare', 'listen', 'bind-mirror'];
      const selected = [...eligible].sort((a, b) => {
        const rank = (id: string) => { const index = preferred.indexOf(id); return index < 0 ? 100 : index; };
        return rank(a.id) - rank(b.id);
      })[0];
      if (!selected) return { state, steps, rejectedCommands: 0, issue: 'no-affordable-choice' };
      if (selected.outcomes.some((outcome) => outcome.effects.some((effect) => effect.op === 'combat'))
        && definition.campaign?.rival && state.convoys[definition.campaign.rival.id]?.locationId !== convoy.locationId) command = waitCommand(state, 1);
      else command = campaignChoice(state, selected.id);
    } else {
      const goal = state.world.facts['hospital.resolved']?.value !== true
        ? state.knowledge.factIds.includes('hospital.rule') ? 'location.ward' : 'location.hospital'
        : state.world.facts['rival.resolved']?.value !== true ? 'location.checkpoint' : 'location.refuge';
      const option = availableRoutes(state, state.player.convoyId, definition).filter((entry) => entry.affordable)
        .sort((a, b) => a.travelTicks + distance(a.destinationId, goal, definition) - b.travelTicks - distance(b.destinationId, goal, definition))[0];
      command = option ? travelCommand(state, option.routeId) : waitCommand(state, 1);
    }
    const result = processCommand(state, command, { principalId: state.player.id }, definition);
    if (!result.ok) return { state, steps, rejectedCommands: 1, issue: `${result.error.code}: ${result.error.message}` };
    state = result.state;
  }
  return { state, steps, rejectedCommands: 0, issue: state.status === 'active' ? 'step-limit' : null };
}

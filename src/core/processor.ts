import { CommandError, commandSchema } from './commands';
import type { CommandAuthority, CommandErrorCode } from './commands';
import type { DomainEvent, DomainEventPayload, FailureReason } from './events';
import { assertGameState } from './invariants';
import { canAfford, countActiveCrew, subtractResources, supplyCosts } from './resources';
import { nextInt } from './rng';
import type { GameState } from './state-schema';
import { planTravel } from '../world/travel';
import type { WorldDefinition } from '../world/schema';

export type CommandResult =
  | { ok: true; state: GameState; events: DomainEvent[] }
  | { ok: false; state: GameState; events: []; error: { code: CommandErrorCode; message: string } };

/** Atomic deterministic transition. Never mutates state, command, authority, or content. */
export function processCommand(state: GameState, input: unknown, authority: CommandAuthority, definition: WorldDefinition): CommandResult {
  const reject = (code: CommandErrorCode, message: string): CommandResult => ({ ok: false, state, events: [], error: { code, message } });
  const parsed = commandSchema.safeParse(input);
  if (!parsed.success) return reject('INVALID_COMMAND', parsed.error.message);
  const command = parsed.data;
  try {
    assertGameState(state, definition);
  } catch (error) {
    return reject('INVALID_STATE', error instanceof Error ? error.message : 'Invalid state');
  }
  if (command.issuerId !== authority.principalId || authority.principalId !== state.player.id) {
    return reject('UNAUTHORIZED', 'Command issuer does not match the trusted principal.');
  }
  if (state.commandLog.some((record) => record.command.id === command.id)) return reject('DUPLICATE_COMMAND', 'Command ID has already been accepted.');
  if (state.status !== 'active') return reject('GAME_ENDED', 'Journey has already ended.');
  const convoy = Object.hasOwn(state.convoys, command.payload.convoyId) ? state.convoys[command.payload.convoyId] : undefined;
  if (!convoy) return reject('UNKNOWN_CONVOY', 'Convoy does not exist.');
  if (convoy.controllerId !== authority.principalId) return reject('UNAUTHORIZED', 'Principal does not control this convoy.');

  try {
    const plan = command.payload.type === 'travel' ? planTravel(state, convoy.id, command.payload.routeId, definition) : null;
    const ticks = plan ? plan.route.travelTicks : command.payload.type === 'wait' ? command.payload.ticks : 0;
    const costs = plan ? plan.costs : supplyCosts(state, convoy, ticks, definition);
    if (!canAfford(convoy.resources, costs)) return reject('INSUFFICIENT_RESOURCES', 'Convoy cannot afford the complete action.');

    const next = structuredClone(state);
    const updatedConvoy = next.convoys[convoy.id];
    if (!updatedConvoy) throw new Error('Missing cloned convoy');
    const events: DomainEvent[] = [];
    const emit = (payload: DomainEventPayload): void => {
      next.eventSequence += 1;
      events.push({ id: `event.${next.eventSequence}`, tick: next.world.tick, payload });
    };
    updatedConvoy.resources = subtractResources(updatedConvoy.resources, costs);
    emit({ type: 'resources.consumed', convoyId: convoy.id, costs, reason: plan ? 'travel' : 'wait' });
    next.world.tick += ticks;
    emit({ type: 'time.advanced', from: state.world.tick, to: next.world.tick });
    if (plan) {
      // Each travel consumes one risk draw, even when the configured chance is zero.
      const riskRoll = nextInt(next.rng, 10_000);
      next.rng = riskRoll.rng;
      if (riskRoll.value < plan.route.risk.chanceBps) {
        const damageRoll = nextInt(next.rng, plan.route.risk.maxDamage - plan.route.risk.minDamage + 1);
        next.rng = damageRoll.rng;
        const damage = Math.min(updatedConvoy.vehicle.condition, plan.route.risk.minDamage + damageRoll.value);
        updatedConvoy.vehicle.condition -= damage;
        emit({ type: 'travel.hazard', routeId: plan.route.id, vehicleId: updatedConvoy.vehicle.id, damage, conditionAfter: updatedConvoy.vehicle.condition });
      }
      // Travel is an atomic turn: arrival and costs resolve even if the vehicle is destroyed en route.
      updatedConvoy.locationId = plan.to;
      const routeState = next.world.routes[plan.route.id];
      const locationState = next.world.locations[plan.to];
      if (!routeState || !locationState) throw new Error('Missing map state');
      routeState.traversals += 1;
      locationState.visits += 1;
      emit({ type: 'convoy.moved', convoyId: convoy.id, routeId: plan.route.id, from: plan.from, to: plan.to });
      if (!next.knowledge.locationIds.includes(plan.to)) {
        next.knowledge.locationIds.push(plan.to);
        emit({ type: 'location.discovered', locationId: plan.to });
      }
    } else {
      emit({ type: 'convoy.waited', convoyId: convoy.id, ticks });
    }

    let failure: FailureReason | null = null;
    if (updatedConvoy.vehicle.condition === 0) failure = 'vehicle-destroyed';
    else if (countActiveCrew(next, updatedConvoy) === 0) failure = 'no-active-crew';
    // The refuge supplies the crew on arrival, including arrival with the last rations.
    const atGoal = definition.goal.locationIds.includes(updatedConvoy.locationId);
    if (!failure && atGoal) {
      next.status = 'won';
      next.ending = { kind: 'victory', id: definition.goal.endingId, tick: next.world.tick, locationId: updatedConvoy.locationId };
      next.world.facts[definition.goal.factId] = { value: true, establishedAt: next.world.tick };
      next.knowledge.factIds.push(definition.goal.factId);
      emit({ type: 'journey.completed', endingId: definition.goal.endingId, locationId: updatedConvoy.locationId });
    } else {
      if (!failure && !canAfford(updatedConvoy.resources, supplyCosts(next, updatedConvoy, 1, definition))) failure = 'supplies-exhausted';
      if (failure) {
        next.status = 'lost';
        next.ending = { kind: 'defeat', id: 'ending.convoy-lost', tick: next.world.tick, reason: failure };
        emit({ type: 'journey.failed', reason: failure });
      }
    }
    next.commandLog.push({ sequence: next.commandLog.length + 1, principalId: authority.principalId,
      command: structuredClone(command), tickBefore: state.world.tick, tickAfter: next.world.tick,
      rngBefore: { ...state.rng }, rngAfter: { ...next.rng }, events: structuredClone(events) });
    assertGameState(next, definition);
    return { ok: true, state: next, events };
  } catch (error) {
    if (error instanceof CommandError) return reject(error.code, error.message);
    // Programming/content errors must surface in tests instead of looking like valid refusals.
    throw error;
  }
}

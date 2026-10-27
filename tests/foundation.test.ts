import { describe, expect, it, vi } from 'vitest';
import { worldDefinition, SCENARIO_ROUTES } from '../src/content/world';
import { createGame } from '../src/core/state';
import { processCommand } from '../src/core/processor';
import { createRng, nextInt, nextUint32 } from '../src/core/rng';
import { replayLog } from '../src/core/replay';
import { canonicalJson } from '../src/core/primitives';
import { loadGame, serializeGame, SaveError } from '../src/persistence/save';
import { LocalSaveStore } from '../src/persistence/local-storage';
import { runRouteScenario, runSurvivalBot, travelCommand, waitCommand } from '../src/simulation/scenarios';
import { simulateBatch } from '../src/simulation/batch';
import { availableRoutes, planTravel } from '../src/world/travel';
import { inspectWorldDefinition, validateWorldDefinition } from '../src/world/registry';
import type { GameState } from '../src/core/state-schema';

const def = worldDefinition;
const initial = () => createGame(42, def);
const apply = (state: GameState, command: unknown, definition = def) => processCommand(state, command, { principalId: state.player.id }, definition);
const first = () => apply(initial(), travelCommand(initial(), 'route.garage-market'));

function freezeDeep<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    Object.values(value).forEach(freezeDeep);
  }
  return value;
}

describe('deterministic foundation', () => {
  it('creates independent equivalent states, including seed zero', () => {
    expect(createGame(0, def)).toEqual(createGame(0, def));
    const a = initial(); const b = initial();
    a.world.locations['location.garage']!.visits = 99;
    expect(b.world.locations['location.garage']!.visits).toBe(1);
  });
  it.each([-1, 0.5, NaN, Infinity, 0x1_0000_0000])('rejects invalid seed %s', (seed) => expect(() => createGame(seed, def)).toThrow());
  it('produces the fixed Mulberry32 reference first value and bounded integers', () => {
    expect(nextUint32(createRng(1)).value).toBe(2693262067);
    let rng = createRng(0);
    for (let i = 0; i < 1000; i += 1) {
      const draw = nextInt(rng, 7); rng = draw.rng;
      expect(draw.value).toBeGreaterThanOrEqual(0); expect(draw.value).toBeLessThan(7);
    }
    expect(() => nextInt(rng, 0)).toThrow();
  });
  it('never calls uncontrolled random or mutates frozen input', () => {
    vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('uncontrolled RNG'); });
    const state = freezeDeep(initial());
    const before = canonicalJson(state);
    const result = apply(state, freezeDeep(travelCommand(state, 'route.garage-market')));
    expect(result.ok).toBe(true); expect(canonicalJson(state)).toBe(before);
  });
  it.each(Object.keys(SCENARIO_ROUTES) as (keyof typeof SCENARIO_ROUTES)[])('finishes %s with reproducible replay', (path) => {
    const a = runRouteScenario(42, SCENARIO_ROUTES[path], def);
    const b = runRouteScenario(42, SCENARIO_ROUTES[path], def);
    expect(a).toEqual(b); expect(a.state.status).toBe('won');
    expect(replayLog(42, a.state.commandLog, def)).toEqual(a.state);
  });
});

describe('commands and atomic turns', () => {
  it.each([
    {}, { id: 'bad', issuerId: 'player.local', payload: { type: 'wait', convoyId: 'convoy.player', ticks: 0 } },
    { id: 'bad', issuerId: 'player.local', payload: { type: 'wait', convoyId: 'convoy.player', ticks: 13 } },
    { id: 'bad', issuerId: 'player.local', payload: { type: 'cheat' } },
  ])('rejects invalid shape without touching state', (command) => {
    const state = initial(); const result = apply(state, command);
    expect(result.ok).toBe(false); expect(result.state).toBe(state); expect(result.events).toEqual([]);
    expect(state.world.tick).toBe(0); expect(state.rng.draws).toBe(0); expect(state.commandLog).toEqual([]);
  });
  it('checks trusted principal independently from body issuer', () => {
    const state = initial(); const result = processCommand(state, travelCommand(state, 'route.garage-market'), { principalId: 'attacker' }, def);
    expect(result.ok ? null : result.error.code).toBe('UNAUTHORIZED'); expect(result.state).toBe(state);
  });
  it('rejects repeated command ID after an accepted turn', () => {
    const command = travelCommand(initial(), 'route.garage-market'); const result = apply(initial(), command);
    if (!result.ok) throw new Error('unexpected rejection');
    const duplicate = apply(result.state, command);
    expect(duplicate.ok ? null : duplicate.error.code).toBe('DUPLICATE_COMMAND');
  });
  it.each(['route.missing', 'route.checkpoint-refuge'])('rejects unavailable route %s', (routeId) => {
    const state = initial(); const result = apply(state, travelCommand(state, routeId));
    expect(result.ok).toBe(false); expect(result.state).toBe(state);
  });
  it('consumes route costs, time and updates world and discovery', () => {
    const result = first(); if (!result.ok) throw new Error('unexpected rejection');
    expect(result.state.world.tick).toBe(2);
    expect(result.state.convoys['convoy.player']!.resources).toEqual({ food: 42, water: 48, fuel: 26, medicine: 4, scrap: 8 });
    expect(result.state.convoys['convoy.player']!.locationId).toBe('location.market');
    expect(result.state.world.routes['route.garage-market']!.traversals).toBe(1);
    expect(result.state.world.locations['location.market']!.visits).toBe(1);
    expect(result.state.knowledge.locationIds).toContain('location.market');
    expect(result.events.map((event) => event.id)).toEqual(result.events.map((_, index) => `event.${index + 1}`));
    result.events[0]!.tick = 100;
    expect(result.state.commandLog[0]!.events[0]!.tick).toBe(0);
  });
  it('blocks routes and inaccessible destinations atomically', () => {
    for (const kind of ['route', 'location']) {
      const state = initial();
      if (kind === 'route') state.world.routes['route.garage-market']!.accessible = false;
      else state.world.locations['location.market']!.accessible = false;
      const result = apply(state, travelCommand(state, 'route.garage-market'));
      expect(result.ok ? null : result.error.code).toBe(kind === 'route' ? 'ROUTE_BLOCKED' : 'LOCATION_BLOCKED');
      expect(result.state).toBe(state); expect(state.world.tick).toBe(0);
    }
  });
  it('does not spend partial resources when fuel or supplies are insufficient', () => {
    for (const resource of ['fuel', 'food'] as const) {
      const custom = structuredClone(def); custom.start.resources[resource] = 3;
      const state = createGame(42, custom); const before = canonicalJson(state);
      const result = apply(state, travelCommand(state, 'route.garage-market'), custom);
      expect(result.ok ? null : result.error.code).toBe('INSUFFICIENT_RESOURCES'); expect(canonicalJson(state)).toBe(before);
    }
  });
  it('wait consumes supplies and time but no fuel or RNG', () => {
    const result = apply(initial(), waitCommand(initial(), 12)); if (!result.ok) throw new Error('unexpected rejection');
    expect(result.state.world.tick).toBe(12); expect(result.state.rng.draws).toBe(0);
    expect(result.state.convoys['convoy.player']!.resources.food).toBe(12);
    expect(result.state.convoys['convoy.player']!.resources.fuel).toBe(30);
  });
  it('loses cleanly when supplies run out, without a negative balance', () => {
    const run = runSurvivalBot(42, def, 'exhaustion');
    expect(run.state.status).toBe('lost'); expect(run.state.ending?.kind === 'defeat' && run.state.ending.reason).toBe('supplies-exhausted');
    expect(Object.values(run.state.convoys['convoy.player']!.resources).every((amount) => amount >= 0)).toBe(true);
    expect(apply(run.state, waitCommand(run.state, 1)).ok).toBe(false);
  });
  it('resolves lethal deterministic hazards as a defeat', () => {
    const custom = structuredClone(def); custom.routes[0]!.risk = { chanceBps: 10000, minDamage: 100, maxDamage: 100 };
    const state = createGame(0, custom); const result = apply(state, travelCommand(state, 'route.garage-market'), custom);
    expect(result.ok).toBe(true); expect(result.state.status).toBe('lost');
    expect(result.state.convoys['convoy.player']!.vehicle.condition).toBe(0);
    expect(result.state.rng.draws).toBe(2);
  });
  it('rejects commands on corrupt state', () => {
    const state = initial(); state.convoys['convoy.player']!.resources.water = -1;
    const result = apply(state, waitCommand(state, 1)); expect(result.ok ? null : result.error.code).toBe('INVALID_STATE');
  });
});

describe('world data', () => {
  it('has multiple choices at the start with exact preview costs', () => {
    const options = availableRoutes(initial(), 'convoy.player', def);
    expect(options).toHaveLength(2); expect(options.every((option) => option.affordable)).toBe(true);
    expect(planTravel(initial(), 'convoy.player', 'route.garage-market', def).costs.fuel).toBe(4);
  });
  it('uses directed route semantics', () => {
    const state = initial(); state.convoys['convoy.player']!.locationId = 'location.refuge';
    expect(() => planTravel(state, 'convoy.player', 'route.checkpoint-refuge', def)).toThrow('current location');
  });
  it('validates all default references', () => expect(inspectWorldDefinition(def)).toEqual([]));
  it.each(['duplicate', 'reference', 'unreachable', 'risk', 'supplies'])('rejects %s content errors', (kind) => {
    const custom = structuredClone(def);
    if (kind === 'duplicate') custom.locations[0]!.id = custom.regions[0]!.id;
    if (kind === 'reference') custom.routes[0]!.to = 'location.missing';
    if (kind === 'unreachable') custom.locations.push({ id: 'location.isolated', regionId: 'region.city', name: 'Isolated', description: 'No route' });
    if (kind === 'risk') custom.routes[0]!.risk.chanceBps = 10001;
    if (kind === 'supplies') custom.start.resources.food = 0;
    expect(() => validateWorldDefinition(custom)).toThrow();
  });
});

describe('save, migration, integrity and replay', () => {
  it('round trips and resumes identically', () => {
    const result = first(); if (!result.ok) throw new Error('unexpected rejection');
    const restored = loadGame(serializeGame(result.state, def), def);
    expect(restored).toEqual(result.state); expect(restored).not.toBe(result.state);
    expect(apply(restored, travelCommand(restored, 'route.market-hospital'))).toEqual(apply(result.state, travelCommand(result.state, 'route.market-hospital')));
  });
  it('migrates a complete development v0 save', () => expect(loadGame(JSON.stringify({ schemaVersion: 0, state: initial() }), def)).toEqual(initial()));
  it.each(['not-json', JSON.stringify({ schemaVersion: 999 }), JSON.stringify({ schemaVersion: 1 })])('rejects malformed or unsupported saves', (save) => expect(() => loadGame(save, def)).toThrow(SaveError));
  it('rejects incompatible content', () => {
    const custom = structuredClone(def); custom.contentVersion = 'different';
    expect(() => loadGame(serializeGame(initial(), def), custom)).toThrow('content version');
  });
  it('detects forged resources and event history', () => {
    const result = first(); if (!result.ok) throw new Error('unexpected rejection');
    const state = result.state; state.convoys['convoy.player']!.resources.fuel += 1;
    expect(() => loadGame(JSON.stringify({ format: 'last-convoy-save', schemaVersion: 1, engineVersion: '0.1.0', contentVersion: def.contentVersion, state }), def)).toThrow('snapshot differs');
    const good = first(); if (!good.ok) throw new Error('unexpected rejection');
    good.state.commandLog[0]!.events[0]!.tick = 1;
    expect(() => replayLog(42, good.state.commandLog, def)).toThrow('diverged');
  });
  it('supports injected localStorage and reports missing slots/quota errors', () => {
    const values = new Map<string, string>();
    const store = new LocalSaveStore({ getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); }, removeItem: (key) => { values.delete(key); } }, def);
    store.save('manual', initial()); expect(store.load('manual')).toEqual(initial());
    store.remove('manual'); expect(() => store.load('manual')).toThrow('does not exist');
    const blocked = new LocalSaveStore({ getItem: () => null, setItem: () => { throw new Error('QuotaExceeded'); }, removeItem: () => {} }, def);
    expect(() => blocked.save('manual', initial())).toThrow('Cannot write');
  });
  it('simulates varied policies with no unresolved active runs', () => {
    const report = simulateBatch(20, def);
    expect(report.totals.runs).toBe(100); expect(report.totals.softlocks).toBe(0);
    expect(report.totals.rejectedCommands).toBe(0); expect(report.totals.wins).toBeGreaterThanOrEqual(60);
    expect(report.totals.losses).toBeGreaterThanOrEqual(20);
  });
});

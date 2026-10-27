import { CommandError } from '../core/commands';
import { canAfford, supplyCosts } from '../core/resources';
import type { Resources } from '../core/primitives';
import type { GameState } from '../core/state-schema';
import type { RouteDefinition, WorldDefinition } from './schema';
import { evaluateCondition } from '../narrative/conditions';

export interface TravelPlan { route: RouteDefinition; from: string; to: string; costs: Resources }

export function planTravel(state: GameState, convoyId: string, routeId: string, definition: WorldDefinition): TravelPlan {
  const convoy = state.convoys[convoyId];
  if (!convoy) throw new CommandError('UNKNOWN_CONVOY', `Unknown convoy: ${convoyId}`);
  const route = definition.routes.find((entry) => entry.id === routeId);
  if (!route) throw new CommandError('UNKNOWN_ROUTE', `Unknown route: ${routeId}`);
  const to = route.from === convoy.locationId ? route.to
    : route.bidirectional && route.to === convoy.locationId ? route.from : null;
  if (to === null) throw new CommandError('ROUTE_NOT_CONNECTED', 'Route does not leave the current location.');
  if (!state.world.routes[routeId]?.accessible) throw new CommandError('ROUTE_BLOCKED', 'Route is blocked.');
  if (!state.world.locations[to]?.accessible) throw new CommandError('LOCATION_BLOCKED', 'Destination is inaccessible.');
  const requirements = definition.campaign?.travelRequirements[to];
  if (requirements && !evaluateCondition(state, requirements)) throw new CommandError('REQUIREMENTS_NOT_MET', 'Destination story requirements are not met.');
  const costs = supplyCosts(state, convoy, route.travelTicks, definition);
  costs.fuel += route.fuelCost;
  return { route, from: convoy.locationId, to, costs };
}

export interface RouteOption {
  routeId: string;
  destinationId: string;
  travelTicks: number;
  riskBps: number;
  costs: Resources;
  affordable: boolean;
}

/** Read model; UI/CLI may display these costs but may never resolve travel themselves. */
export function availableRoutes(state: GameState, convoyId: string, definition: WorldDefinition): RouteOption[] {
  if (state.status !== 'active') return [];
  return definition.routes.flatMap((route): RouteOption[] => {
    try {
      const plan = planTravel(state, convoyId, route.id, definition);
      const convoy = state.convoys[convoyId];
      if (!convoy) return [];
      return [{ routeId: route.id, destinationId: plan.to, travelTicks: route.travelTicks,
        riskBps: route.risk.chanceBps, costs: plan.costs, affordable: canAfford(convoy.resources, plan.costs) }];
    } catch (error) {
      if (error instanceof CommandError) return [];
      throw error;
    }
  });
}

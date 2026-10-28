import { establishFact } from "../core/facts";
import { canAfford, subtractResources, supplyCosts } from "../core/resources";
import type { GameState } from "../core/state-schema";
import type { Emit } from "../narrative/effects";
import type { RouteDefinition, WorldDefinition } from "./schema";

function pathTo(
  state: GameState,
  from: string,
  to: string,
  definition: WorldDefinition,
): { route: RouteDefinition; to: string } | null {
  const queue: {
    location: string;
    first: { route: RouteDefinition; to: string } | null;
  }[] = [{ location: from, first: null }];
  const visited = new Set([from]);
  for (const node of queue) {
    if (node.location === to) return node.first;
    for (const route of definition.routes) {
      const next =
        route.from === node.location
          ? route.to
          : route.bidirectional && route.to === node.location
            ? route.from
            : null;
      if (
        !next ||
        visited.has(next) ||
        !state.world.routes[route.id]?.accessible ||
        !state.world.locations[next]?.accessible
      )
        continue;
      visited.add(next);
      queue.push({ location: next, first: node.first ?? { route, to: next } });
    }
  }
  return null;
}

/** A goal-driven rival acts on the world clock, can search for and acquire the same physical artifact. */
export function updateRival(
  state: GameState,
  definition: WorldDefinition,
  emit: Emit,
): void {
  const rival = definition.campaign?.rival;
  if (!rival) return;
  const npc = state.world.npcs[rival.id];
  const convoy = state.convoys[rival.id];
  if (!npc || !convoy) throw new Error("Missing rival state");
  if (convoy.actorIds.every((id) => state.actors[id]?.status !== "active")) {
    npc.intent = "defeated";
    if (convoy.actorIds.every((id) => state.actors[id]?.status === "dead"))
      establishFact(state, "rival.dead", true);
    return;
  }
  if (
    state.combat?.enemyConvoyId === rival.id ||
    state.world.facts["rival.resolved"]?.value === true
  )
    return;
  const goal = Object.values(state.inventory.artifactInstances).find(
    (entry) => entry.artifactId === rival.goalArtifactId,
  );
  for (
    let step = 0;
    npc.nextActionTick <= state.world.tick && step < 32;
    step += 1
  ) {
    const playerLocation = state.convoys[state.player.convoyId]?.locationId;
    const intercept =
      goal?.ownerId === state.player.convoyId ||
      goal?.ownerId === rival.id ||
      playerLocation === rival.interceptLocationId;
    const search =
      !intercept &&
      npc.nextActionTick >= rival.acquireAfterTick &&
      goal &&
      Object.hasOwn(state.world.locations, goal.ownerId);
    const destination = search ? goal.ownerId : rival.interceptLocationId;
    npc.intent = search ? "search" : intercept ? "intercept" : "guard";
    if (goal && search && convoy.locationId === goal.ownerId) {
      const fromOwnerId = goal.ownerId;
      goal.ownerId = convoy.id;
      establishFact(state, "rival.stole-mirror", true);
      emit({
        type: "artifact.transferred",
        artifactId: goal.artifactId,
        fromOwnerId,
        toOwnerId: convoy.id,
      });
    }
    const path = pathTo(state, convoy.locationId, destination, definition);
    if (path) {
      const costs = supplyCosts(
        state,
        convoy,
        path.route.travelTicks,
        definition,
      );
      costs.fuel += path.route.fuelCost;
      if (canAfford(convoy.resources, costs)) {
        convoy.resources = subtractResources(convoy.resources, costs);
        convoy.locationId = path.to;
      }
      npc.nextActionTick += path.route.travelTicks;
    } else npc.nextActionTick += 2;
    emit({
      type: "npc.acted",
      convoyId: convoy.id,
      intent: npc.intent,
      locationId: convoy.locationId,
    });
  }
}

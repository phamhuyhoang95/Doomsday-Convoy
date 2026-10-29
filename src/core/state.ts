import { ENGINE_VERSION, STATE_SCHEMA_VERSION } from "./primitives";
import { createRng } from "./rng";
import type { GameState } from "./state-schema";
import { validateWorldDefinition } from "../world/registry";
import type { WorldDefinition } from "../world/schema";
import { refreshNarrative } from "../narrative/director";
import { createActor } from "./actors";
import { initializeProgression } from "../expedition/progression";

export function createGame(seed: number, input: WorldDefinition): GameState {
  const definition = validateWorldDefinition(input);
  const { start } = definition;
  const rng = createRng(seed);
  const state: GameState = {
    schemaVersion: STATE_SCHEMA_VERSION,
    engineVersion: ENGINE_VERSION,
    contentVersion: definition.contentVersion,
    initialSeed: seed,
    rng,
    status: "active",
    ending: null,
    player: { id: start.playerId, convoyId: start.convoyId },
    actors: Object.fromEntries(
      start.characterIds.map((id) => {
        const character = definition.characters.find(
          (entry) => entry.id === id,
        );
        if (!character) throw new Error(`Missing starting character: ${id}`);
        return [
          id,
          createActor(character, start.convoyId, Boolean(definition.campaign)),
        ];
      }),
    ),
    convoys: {
      [start.convoyId]: {
        id: start.convoyId,
        controllerId: start.playerId,
        locationId: start.locationId,
        actorIds: [...start.characterIds],
        resources: { ...start.resources },
        vehicle: { ...start.vehicle, condition: start.vehicle.maxCondition },
      },
    },
    world: {
      tick: 0,
      locations: Object.fromEntries(
        definition.locations.map((location) => [
          location.id,
          {
            id: location.id,
            accessible: true,
            visits: location.id === start.locationId ? 1 : 0,
          },
        ]),
      ),
      routes: Object.fromEntries(
        definition.routes.map((route) => [
          route.id,
          { id: route.id, accessible: true, traversals: 0 },
        ]),
      ),
      facts: Object.fromEntries(
        (definition.campaign?.facts ?? [])
          .filter((fact) => fact.initialValue !== undefined)
          .map((fact) => [
            fact.id,
            {
              value: fact.initialValue as boolean | number | string,
              establishedAt: 0,
            },
          ]),
      ),
      npcs: {},
    },
    inventory: {
      artifactInstances: Object.fromEntries(
        (definition.campaign?.artifacts ?? []).map((artifact) => {
          const id = `instance.${artifact.id}`;
          return [
            id,
            { id, artifactId: artifact.id, ownerId: artifact.initialOwnerId },
          ];
        }),
      ),
    },
    knowledge: { locationIds: [start.locationId], factIds: [] },
    activeEvents: [],
    activeQuests: [],
    campaign: definition.campaign
      ? {
          id: definition.campaign.id,
          eventCounts: {},
          pendingHooks: [],
          lastOutcomeKey: null,
        }
      : null,
    combat: null,
    ...(definition.contentVersion === "0.1.0-campaign.4"
      ? {}
      : { scenario: null }),
    eventSequence: 0,
    commandLog: [],
  };
  if (definition.campaign?.operations && state.campaign) {
    state.campaign.operations = { recon: {} };
    Object.values(state.actors).forEach((actor) =>
      initializeProgression(actor, definition),
    );
  }
  for (const encounter of definition.campaign?.encounters ?? []) {
    state.convoys[encounter.convoyId] = {
      id: encounter.convoyId,
      controllerId: "npc.encounter",
      locationId: encounter.locationId,
      actorIds: [...encounter.characterIds],
      resources: { ...encounter.resources },
      vehicle: {
        ...encounter.vehicle,
        condition: encounter.vehicle.maxCondition,
      },
    };
    for (const id of encounter.characterIds) {
      const character = definition.characters.find((entry) => entry.id === id);
      if (!character) throw new Error("Missing encounter actor");
      state.actors[id] = createActor(character, encounter.convoyId, true);
    }
  }
  const rival = definition.campaign?.rival;
  if (rival) {
    state.convoys[rival.id] = {
      id: rival.id,
      controllerId: "npc.tro-tan",
      locationId: rival.startingLocationId,
      actorIds: [...rival.characterIds],
      resources: { ...rival.resources },
      vehicle: { ...rival.vehicle, condition: rival.vehicle.maxCondition },
    };
    state.world.npcs[rival.id] = {
      id: rival.id,
      goalArtifactId: rival.goalArtifactId,
      intent: "guard",
      nextActionTick: 4,
    };
    rival.characterIds.forEach((id) => {
      const character = definition.characters.find((entry) => entry.id === id);
      if (!character) throw new Error("Missing rival character");
      state.actors[id] = createActor(character, rival.id, true);
    });
  }
  refreshNarrative(state, definition, () => {});
  return state;
}

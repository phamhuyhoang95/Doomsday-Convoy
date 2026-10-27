import type { ActorState } from "./state-schema";
import type { WorldDefinition } from "../world/schema";

export function createActor(
  character: WorldDefinition["characters"][number],
  convoyId: string,
  withAbilities: boolean,
): ActorState {
  const actor: ActorState = {
    id: character.id,
    name: character.name,
    role: character.role,
    maxHealth: character.maxHealth,
    health: character.maxHealth,
    convoyId,
    status: "active",
  };
  if (withAbilities) {
    actor.attributes = {
      attack: character.attack ?? 10,
      defense: character.defense ?? 2,
      maxEnergy: character.maxEnergy ?? 6,
    };
    actor.energy = actor.attributes.maxEnergy;
    actor.skillIds = [...(character.skillIds ?? [])];
    actor.cooldowns = {};
  }
  return actor;
}

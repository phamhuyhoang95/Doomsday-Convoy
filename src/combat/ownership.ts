import { RESOURCE_IDS } from '../core/primitives';
import type { GameState } from '../core/state-schema';
import type { Emit } from '../narrative/effects';

export function transferOwnedArtifacts(state: GameState, fromOwnerId: string, toOwnerId: string, emit: Emit): void {
  for (const artifact of Object.values(state.inventory.artifactInstances)) {
    if (artifact.ownerId !== fromOwnerId) continue;
    artifact.ownerId = toOwnerId;
    emit({ type: 'artifact.transferred', artifactId: artifact.artifactId, fromOwnerId, toOwnerId });
  }
}

export function lootConvoy(state: GameState, fromId: string, toId: string, emit: Emit): void {
  const from = state.convoys[fromId]; const to = state.convoys[toId];
  if (!from || !to) throw new Error('Missing loot convoy');
  transferOwnedArtifacts(state, fromId, toId, emit);
  for (const resource of RESOURCE_IDS) {
    const amount = Math.min(from.resources[resource], 1_000_000 - to.resources[resource]);
    from.resources[resource] -= amount; to.resources[resource] += amount;
  }
}

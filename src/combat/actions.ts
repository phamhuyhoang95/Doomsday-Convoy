import { CommandError } from '../core/commands';
import { nextInt } from '../core/rng';
import type { ActorState, GameState } from '../core/state-schema';
import type { Emit } from '../narrative/effects';
import type { WorldDefinition } from '../world/schema';

export function artifactBonus(state: GameState, actor: ActorState, definition: WorldDefinition, kind: 'attackBonus' | 'defenseBonus'): number {
  return Object.values(state.inventory.artifactInstances).filter((entry) => entry.ownerId === actor.convoyId)
    .reduce((sum, entry) => sum + (definition.campaign?.artifacts.find((artifact) => artifact.id === entry.artifactId)?.[kind] ?? 0), 0);
}

export function dealDamage(state: GameState, attackerId: string, targetId: string, power: number, definition: WorldDefinition, emit: Emit, action = 'attack'): void {
  const attacker = state.actors[attackerId]; const target = state.actors[targetId];
  if (!attacker || !target || target.status !== 'active' || target.convoyId === attacker.convoyId) throw new CommandError('INVALID_TARGET', 'Select an active enemy.');
  const roll = nextInt(state.rng, 5); state.rng = roll.rng;
  const guarded = state.combat?.defendedActorIds.includes(target.id) ?? false;
  const raw = (attacker.attributes?.attack ?? 10) + power + roll.value + artifactBonus(state, attacker, definition, 'attackBonus')
    - (target.attributes?.defense ?? 2) - artifactBonus(state, target, definition, 'defenseBonus');
  const damage = Math.min(target.health, Math.max(1, guarded ? Math.floor(raw / 2) : raw));
  target.health -= damage; if (target.health === 0) target.status = 'downed';
  state.combat?.log.push(`${attacker.name} → ${target.name}: ${damage}`);
  emit({ type: 'combat.action', actorId: attacker.id, action, targetId: target.id, amount: damage });
}

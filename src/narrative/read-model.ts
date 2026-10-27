import { canAfford, subtractResources, supplyCosts } from '../core/resources';
import type { GameState } from '../core/state-schema';
import type { WorldDefinition } from '../world/schema';
import { evaluateCondition } from './conditions';
import type { Condition, EventDefinition } from './schema';

export function choiceAvailability(state: GameState, choice: EventDefinition['choices'][number], definition: WorldDefinition): { enabled: boolean; reason: string } {
  const convoy = state.convoys[state.player.convoyId];
  if (!convoy || state.status !== 'active' || state.combat) return { enabled: false, reason: 'Hành động hiện không khả dụng.' };
  const supplies = supplyCosts(state, convoy, 1, definition);
  if (!canAfford(convoy.resources, supplies)) return { enabled: false, reason: 'Không đủ khẩu phần cho một lượt.' };
  const forecast = { ...state, convoys: { ...state.convoys, [convoy.id]: { ...convoy, resources: subtractResources(convoy.resources, supplies) } } };
  if (!evaluateCondition(forecast, choice.requirements)) return { enabled: false, reason: conditionDescription(choice.requirements, definition) };
  if (!canAfford(forecast.convoys[convoy.id]!.resources, choice.costs)) return { enabled: false, reason: 'Không đủ vật tư (bao gồm khẩu phần một lượt).' };
  return { enabled: true, reason: '1 lượt · tiêu khẩu phần của đoàn' };
}

export function conditionDescription(condition: Condition, definition: WorldDefinition): string {
  const factText = (id: string): string => definition.campaign?.facts.find((fact) => fact.id === id)?.description ?? id;
  switch (condition.op) {
    case 'always': return 'Không có điều kiện bổ sung';
    case 'all': return condition.conditions.map((item) => conditionDescription(item, definition)).join(' · ');
    case 'any': return condition.conditions.map((item) => conditionDescription(item, definition)).join(' hoặc ');
    case 'not': return `Chưa: ${conditionDescription(condition.condition, definition)}`;
    case 'known': return `Cần manh mối: ${factText(condition.id)}`;
    case 'fact': return `Cần: ${factText(condition.id)}`;
    case 'resource': return `Cần ${condition.atLeast} ${condition.resource}`;
    case 'at': return `Tại ${definition.locations.find((entry) => entry.id === condition.locationId)?.name ?? condition.locationId}`;
    case 'owns': return `Cần sở hữu ${definition.campaign?.artifacts.find((entry) => entry.id === condition.artifactId)?.name ?? condition.artifactId}`;
    case 'actor': return `Cần ${definition.characters.find((entry) => entry.id === condition.actorId)?.name ?? condition.actorId}: ${condition.status}`;
    case 'location': return condition.accessible ? 'Địa điểm phải có thể tiếp cận' : 'Địa điểm đã bị phong tỏa';
    case 'quest': return 'Cần hoàn tất mục tiêu liên quan';
  }
}

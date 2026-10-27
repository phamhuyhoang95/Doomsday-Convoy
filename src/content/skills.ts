import { emptyResources } from '../core/primitives';
import type { CampaignContent } from '../narrative/schema';

export const skills: CampaignContent['skills'] = [
  { id: 'skill.strike', name: 'Phá giáp', description: 'Đòn tập trung sát thương lớn.', target: 'enemy', effect: 'damage', power: 12, energyCost: 2, costs: emptyResources(), cooldownTicks: 2, requirements: { op: 'always' } },
  { id: 'skill.heal', name: 'Cấp cứu', description: 'Hồi 24 HP, có thể vực đồng đội downed dậy; tốn 1 medicine.', target: 'ally', effect: 'heal', power: 24, energyCost: 1, costs: { ...emptyResources(), medicine: 1 }, cooldownTicks: 2, requirements: { op: 'always' } },
  { id: 'skill.guard', name: 'Hộ tống', description: 'Giảm sát thương đến lượt kế và hồi 8 HP.', target: 'self', effect: 'guard', power: 8, energyCost: 1, costs: emptyResources(), cooldownTicks: 1, requirements: { op: 'always' } },
  { id: 'skill.sense', name: 'Linh cảm', description: 'Khám phá quy tắc bệnh viện mà không đáp lời tiếng gọi.', target: 'exploration', effect: 'reveal', power: 0, energyCost: 2, costs: emptyResources(), cooldownTicks: 3, factId: 'hospital.rule', requirements: { op: 'any', conditions: [{ op: 'at', locationId: 'location.hospital' }, { op: 'at', locationId: 'location.ward' }] } },
];

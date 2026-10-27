import type { CampaignContent } from '../narrative/schema';

export const rival: NonNullable<CampaignContent['rival']> = {
  id: 'convoy.rival', name: 'Đoàn Tro Tàn', characterIds: ['character.raven', 'character.ash'],
  startingLocationId: 'location.checkpoint', interceptLocationId: 'location.checkpoint', goalArtifactId: 'artifact.mirror', acquireAfterTick: 22,
  resources: { food: 24, water: 30, fuel: 18, medicine: 2, scrap: 6 },
  vehicle: { id: 'vehicle.rival', name: 'Xe tải Tro Tàn', maxCondition: 80 },
  negotiationCondition: { op: 'known', id: 'hospital.rule' },
};

import { validateWorldDefinition } from '../world/registry';

/** Stable IDs and data only. No executable conditions, asset paths, or per-act engine hooks. */
export const worldDefinition = validateWorldDefinition({
  contentVersion: '0.1.0-foundation.1',
  regions: [
    { id: 'region.city', name: 'Thành phố tắt đèn' },
    { id: 'region.hospital', name: 'Bệnh viện Thánh An' },
    { id: 'region.outskirts', name: 'Vành đai phía bắc' },
  ],
  locations: [
    { id: 'location.garage', regionId: 'region.city', name: 'Gara cuối phố', description: 'Ba người sống sót và một chiếc xe còn chạy được.' },
    { id: 'location.market', regionId: 'region.city', name: 'Chợ sơ tán', description: 'Những tấm bạt vẫn đập vào sạp hàng bỏ trống.' },
    { id: 'location.overpass', regionId: 'region.city', name: 'Cầu vượt đổ', description: 'Lối vòng qua dòng xe đã chết.' },
    { id: 'location.service', regionId: 'region.city', name: 'Trạm dịch vụ', description: 'Một đường tránh dài nhưng ít nguy hiểm hơn.' },
    { id: 'location.hospital', regionId: 'region.hospital', name: 'Sân bệnh viện', description: 'Đèn cấp cứu sáng trong một tòa nhà không có điện.' },
    { id: 'location.ward', regionId: 'region.hospital', name: 'Khu điều trị cũ', description: 'Không tiếng bước chân nào vọng lại đúng nhịp.' },
    { id: 'location.checkpoint', regionId: 'region.outskirts', name: 'Trạm thu phí', description: 'Những vệt bánh xe mới dẫn về phía bắc.' },
    { id: 'location.refuge', regionId: 'region.outskirts', name: 'Hầm trú Bắc Sơn', description: 'Tín hiệu cứu hộ phát ra sau cánh cửa thép.' },
  ],
  routes: [
    { id: 'route.garage-market', from: 'location.garage', to: 'location.market', bidirectional: true, travelTicks: 2, fuelCost: 4, risk: { chanceBps: 1500, minDamage: 6, maxDamage: 12 } },
    { id: 'route.garage-overpass', from: 'location.garage', to: 'location.overpass', bidirectional: true, travelTicks: 3, fuelCost: 3, risk: { chanceBps: 1000, minDamage: 5, maxDamage: 10 } },
    { id: 'route.market-service', from: 'location.market', to: 'location.service', bidirectional: true, travelTicks: 2, fuelCost: 3, risk: { chanceBps: 800, minDamage: 4, maxDamage: 8 } },
    { id: 'route.market-hospital', from: 'location.market', to: 'location.hospital', bidirectional: true, travelTicks: 3, fuelCost: 5, risk: { chanceBps: 2000, minDamage: 8, maxDamage: 18 } },
    { id: 'route.overpass-service', from: 'location.overpass', to: 'location.service', bidirectional: true, travelTicks: 3, fuelCost: 4, risk: { chanceBps: 500, minDamage: 4, maxDamage: 8 } },
    { id: 'route.service-hospital', from: 'location.service', to: 'location.hospital', bidirectional: true, travelTicks: 2, fuelCost: 3, risk: { chanceBps: 800, minDamage: 5, maxDamage: 10 } },
    { id: 'route.hospital-ward', from: 'location.hospital', to: 'location.ward', bidirectional: true, travelTicks: 1, fuelCost: 1, risk: { chanceBps: 1000, minDamage: 2, maxDamage: 5 } },
    { id: 'route.hospital-checkpoint', from: 'location.hospital', to: 'location.checkpoint', bidirectional: true, travelTicks: 3, fuelCost: 5, risk: { chanceBps: 2000, minDamage: 10, maxDamage: 20 } },
    { id: 'route.ward-checkpoint', from: 'location.ward', to: 'location.checkpoint', bidirectional: true, travelTicks: 2, fuelCost: 4, risk: { chanceBps: 2500, minDamage: 10, maxDamage: 20 } },
    { id: 'route.service-checkpoint', from: 'location.service', to: 'location.checkpoint', bidirectional: true, travelTicks: 5, fuelCost: 8, risk: { chanceBps: 1000, minDamage: 6, maxDamage: 12 } },
    { id: 'route.checkpoint-refuge', from: 'location.checkpoint', to: 'location.refuge', bidirectional: false, travelTicks: 3, fuelCost: 5, risk: { chanceBps: 1500, minDamage: 8, maxDamage: 15 } },
  ],
  characters: [
    { id: 'character.minh', name: 'Minh', role: 'Chỉ huy', maxHealth: 100 },
    { id: 'character.lan', name: 'Lan', role: 'Y sĩ', maxHealth: 80 },
    { id: 'character.bao', name: 'Bảo', role: 'Thợ máy', maxHealth: 90 },
  ],
  start: {
    playerId: 'player.local', convoyId: 'convoy.player', locationId: 'location.garage',
    characterIds: ['character.minh', 'character.lan', 'character.bao'],
    resources: { food: 48, water: 54, fuel: 30, medicine: 4, scrap: 8 },
    vehicle: { id: 'vehicle.bus', name: 'Xe khách số 07', maxCondition: 100 },
  },
  rules: { foodPerCrewPerTick: 1, waterPerCrewPerTick: 1, tickMinutes: 60 },
  goal: { locationIds: ['location.refuge'], endingId: 'ending.arrival', factId: 'journey.refuge-reached' },
});

/** Traverses the three future act regions; this is a travel scenario, not a complete campaign. */
export const SCENARIO_ROUTES = {
  direct: ['route.garage-market', 'route.market-hospital', 'route.hospital-ward', 'route.ward-checkpoint', 'route.checkpoint-refuge'],
  detour: ['route.garage-overpass', 'route.overpass-service', 'route.service-hospital', 'route.hospital-checkpoint', 'route.checkpoint-refuge'],
  bypass: ['route.garage-market', 'route.market-service', 'route.service-checkpoint', 'route.checkpoint-refuge'],
} as const;

import { worldDefinition } from './world';
import { validateWorldDefinition } from '../world/registry';
import { all, choice, event, fact, known, not, owns, quest, reward, setFact } from './builders';
import { skills } from './skills';
import { rival } from './rival';

const factIds = ['story.departed', 'hospital.rule', 'hospital.resolved', 'rival.resolved', 'story.rescued', 'rival.dead', 'rival.defeated', 'rival.captured', 'rival.peaceful', 'rival.surrendered', 'rival.escaped', 'rival.stole-mirror', 'rival.motive'];
const events = [
  event('departure', 'location.garage', [choice('prepare', [setFact('story.departed'), reward('food', 12), reward('water', 12)]), choice('rush', [setFact('story.departed'), reward('fuel', 4)])]),
  event('hospital-bell', 'location.hospital', [choice('listen', [{ op: 'anomaly', anomalyId: 'anomaly.bell', obey: true }]), choice('ignore-bell', [{ op: 'anomaly', anomalyId: 'anomaly.bell', obey: false }])]),
  event('ward-mirror', 'location.ward', [choice('bind-mirror', [{ op: 'artifact', artifactId: 'artifact.mirror', fromOwnerId: 'location.ward', toOwnerId: 'convoy.player' }, setFact('hospital.resolved')], known('hospital.rule')), choice('seal-ward', [setFact('hospital.resolved'), { op: 'location', locationId: 'location.ward', accessible: false }])]),
  event('checkpoint-parley', 'location.checkpoint', [
    choice('signal-passage', [setFact('rival.resolved'), setFact('rival.peaceful')], known('hospital.rule')),
    choice('trade-mirror', [{ op: 'artifact', artifactId: 'artifact.mirror', fromOwnerId: 'convoy.player', toOwnerId: 'convoy.rival' }, setFact('rival.resolved'), setFact('rival.peaceful'), reward('fuel', 6)], owns('artifact.mirror')),
    choice('fight', [{ op: 'combat', enemyConvoyId: 'convoy.rival', ambush: false }]),
    choice('ambush', [{ op: 'combat', enemyConvoyId: 'convoy.rival', ambush: true }], { op: 'resource', resource: 'scrap', atLeast: 2 }, { scrap: 2 }),
    choice('yield-passage', [setFact('rival.resolved'), setFact('rival.surrendered'), { op: 'damage', target: 'vehicle', amount: 10 }]),
  ], all(fact('hospital.resolved'), not(fact('rival.resolved')))),
];
const quests = [
  quest('departure', fact('story.departed'), { op: 'at', locationId: 'location.hospital' }),
  quest('hospital', fact('hospital.resolved'), all({ op: 'location', locationId: 'location.ward', accessible: false }, owns('artifact.lantern')), [setFact('hospital.resolved')]),
  quest('rival', fact('rival.resolved'), fact('rival.dead'), [setFact('rival.resolved')]),
];
const texts: Record<string, string> = {
  'event.departure.title': 'Trước khi rời thành phố', 'event.departure.text': 'Minh kiểm tra cửa xe. Lan chia khẩu phần. Bảo chờ lệnh nổ máy.',
  'event.hospital-bell.title': 'Tiếng chuông trong nhà xác', 'event.hospital-bell.text': 'Chuông reo ba tiếng. Từ hành lang, ai đó gọi đúng tên bạn. Một mẩu giấy ghi: đừng trả lời khi chuông ngân.',
  'event.ward-mirror.title': 'Mắt gương', 'event.ward-mirror.text': 'Trong căn phòng tối, một chiếc gương phản chiếu người thứ tư đang đứng sau đoàn.',
  'event.checkpoint-parley.title': 'Tín hiệu ở trạm thu phí', 'event.checkpoint-parley.text': 'Một kênh vô tuyến hỏi ý định của đoàn trước khi mở đường lên Bắc Sơn.',
  'choice.prepare': 'Chia vật tư dự trữ', 'outcome.prepare': 'Đoàn đã sẵn sàng; khẩu phần được phân phối.',
  'choice.rush': 'Khởi hành ngay', 'outcome.rush': 'Bạn rời thành phố trước khi màn đêm dày thêm.',
  'choice.listen': 'Im lặng, quan sát chuông', 'outcome.listen': 'Bạn đã biết quy tắc: không trả lời tiếng gọi khi chuông reo.',
  'choice.ignore-bell': 'Đáp lại tiếng gọi', 'outcome.ignore-bell': 'Giọng nói chui vào đầu cả đoàn. Mỗi người mất một phần sức khỏe.',
  'choice.bind-mirror': 'Giữ im lặng và lấy gương', 'outcome.bind-mirror': 'Gương được bọc trong vải; quyền sở hữu thuộc về đoàn.',
  'choice.seal-ward': 'Niêm phong khu điều trị', 'outcome.seal-ward': 'Khu điều trị bị khóa lại. Đoàn rời khỏi bệnh viện mà không mang theo gương.',
  'choice.signal-passage': 'Gửi tín hiệu xin qua', 'outcome.signal-passage': 'Tuyến lên nơi trú đã được thông báo an toàn.',
  'choice.trade-mirror': 'Đổi gương lấy quyền qua và 6 nhiên liệu', 'outcome.trade-mirror': 'Tro Tàn nhận gương. Bạn giữ được mạng sống và lối về.',
  'choice.fight': 'Giao chiến', 'outcome.fight': 'Đoàn Tro Tàn khóa lối đi. Trận chiến bắt đầu.',
  'choice.ambush': 'Phục kích (2 scrap)', 'outcome.ambush': 'Cạm bẫy gây 10 sát thương lên mỗi đối thủ trước giao chiến.',
  'choice.yield-passage': 'Nhường đường, chấp nhận hư hại', 'outcome.yield-passage': 'Đoàn thoát qua dải phân cách; xe mất 10 condition.',
};
for (const id of ['departure', 'hospital', 'rival']) {
  texts[`quest.${id}.title`] = id === 'departure' ? 'Rời thành phố' : id === 'hospital' ? 'Quy tắc của bệnh viện' : 'Đường đến Bắc Sơn';
  texts[`quest.${id}.text`] = 'Thực hiện mục tiêu hoặc tìm cách giải quyết thay thế khi thế giới thay đổi.';
  texts[`quest.${id}.objective`] = id === 'departure' ? 'Chuẩn bị hoặc tìm đường rời thành phố.' : id === 'hospital' ? 'Giải quyết bệnh viện, hoặc dùng đèn khi khu điều trị bị khóa.' : 'Giải quyết chướng ngại ở trạm thu phí.';
}

export const campaignDefinition = validateWorldDefinition({
  ...structuredClone(worldDefinition), contentVersion: '0.1.0-campaign.2',
  characters: [
    ...worldDefinition.characters.map((character) => ({ ...character, attack: character.id === 'character.minh' ? 14 : 11, defense: 3, maxEnergy: 6,
      skillIds: character.id === 'character.lan' ? ['skill.heal', 'skill.sense'] : ['skill.strike', 'skill.guard'] })),
    { id: 'character.raven', name: 'Quạ', role: 'Thủ lĩnh Tro Tàn', maxHealth: 36, attack: 9, defense: 2, maxEnergy: 4, skillIds: [] },
    { id: 'character.ash', name: 'Tàn', role: 'Hộ vệ', maxHealth: 30, attack: 8, defense: 1, maxEnergy: 4, skillIds: [] },
  ],
  start: { ...structuredClone(worldDefinition.start), resources: { food: 96, water: 108, fuel: 34, medicine: 8, scrap: 12 } },
  campaign: {
    id: 'campaign.last-convoy', texts, facts: factIds.map((id) => ({ id, description: id, ...(id === 'hospital.rule' ? { initialValue: true } : {}) })), events, quests,
    travelRequirements: { 'location.checkpoint': fact('hospital.resolved'), 'location.refuge': fact('rival.resolved') },
    artifacts: [
      { id: 'artifact.mirror', name: 'Mắt gương', description: 'Nhìn thấy thứ đang nhìn lại.', initialOwnerId: 'location.ward', attackBonus: 3, defenseBonus: 0 },
      { id: 'artifact.lantern', name: 'Đèn không tắt', description: 'Ngọn lửa giữ lối về khỏi bóng tối.', initialOwnerId: 'location.service', attackBonus: 0, defenseBonus: 2 },
    ],
    skills, assets: [], rival,
    anomalies: [{ id: 'anomaly.bell', name: 'Người gọi tên', ruleFactId: 'hospital.rule', violationEffects: [{ op: 'damage', target: 'crew', amount: 12 }] }],
  },
});

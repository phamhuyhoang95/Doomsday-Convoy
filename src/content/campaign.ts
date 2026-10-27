import { worldDefinition } from './world';
import { validateWorldDefinition } from '../world/registry';
import { all, choice, event, fact, known, owns, quest, reward, setFact } from './builders';

const factIds = ['story.departed', 'hospital.rule', 'hospital.resolved', 'rival.resolved', 'story.rescued', 'rival.dead'];
const events = [
  event('departure', 'location.garage', [choice('prepare', [setFact('story.departed'), reward('food', 12), reward('water', 12)]), choice('rush', [setFact('story.departed'), reward('fuel', 4)])]),
  event('hospital-bell', 'location.hospital', [choice('listen', [setFact('hospital.rule')]), choice('ignore-bell', [{ op: 'damage', target: 'crew', amount: 12 }, setFact('hospital.rule')])]),
  event('ward-mirror', 'location.ward', [choice('bind-mirror', [{ op: 'artifact', artifactId: 'artifact.mirror', fromOwnerId: 'location.ward', toOwnerId: 'convoy.player' }, setFact('hospital.resolved')], known('hospital.rule')), choice('seal-ward', [setFact('hospital.resolved'), { op: 'location', locationId: 'location.ward', accessible: false }])]),
  event('checkpoint-parley', 'location.checkpoint', [choice('signal-passage', [setFact('rival.resolved')])], fact('hospital.resolved')),
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
};
for (const id of ['departure', 'hospital', 'rival']) {
  texts[`quest.${id}.title`] = id === 'departure' ? 'Rời thành phố' : id === 'hospital' ? 'Quy tắc của bệnh viện' : 'Đường đến Bắc Sơn';
  texts[`quest.${id}.text`] = 'Thực hiện mục tiêu hoặc tìm cách giải quyết thay thế khi thế giới thay đổi.';
  texts[`quest.${id}.objective`] = id === 'departure' ? 'Chuẩn bị hoặc tìm đường rời thành phố.' : id === 'hospital' ? 'Giải quyết bệnh viện, hoặc dùng đèn khi khu điều trị bị khóa.' : 'Giải quyết chướng ngại ở trạm thu phí.';
}

export const campaignDefinition = validateWorldDefinition({
  ...structuredClone(worldDefinition), contentVersion: '0.1.0-campaign.1',
  start: { ...structuredClone(worldDefinition.start), resources: { food: 96, water: 108, fuel: 34, medicine: 8, scrap: 12 } },
  campaign: {
    id: 'campaign.last-convoy', texts, facts: factIds.map((id) => ({ id, description: id })), events, quests,
    travelRequirements: { 'location.checkpoint': fact('hospital.resolved'), 'location.refuge': fact('rival.resolved') },
    artifacts: [
      { id: 'artifact.mirror', name: 'Mắt gương', description: 'Nhìn thấy thứ đang nhìn lại.', initialOwnerId: 'location.ward', attackBonus: 3, defenseBonus: 0 },
      { id: 'artifact.lantern', name: 'Đèn không tắt', description: 'Ngọn lửa giữ lối về khỏi bóng tối.', initialOwnerId: 'location.service', attackBonus: 0, defenseBonus: 2 },
    ],
    skills: [], assets: [],
    anomalies: [{ id: 'anomaly.bell', name: 'Người gọi tên', ruleFactId: 'hospital.rule', violationEffects: [{ op: 'damage', target: 'crew', amount: 12 }] }],
  },
});

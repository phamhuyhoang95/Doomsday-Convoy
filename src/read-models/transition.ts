import type { GameCommand } from "../core/commands";
import type { DomainEvent } from "../core/events";
import { emptyResources, RESOURCE_IDS } from "../core/primitives";
import type { Resources } from "../core/primitives";
import type { GameState } from "../core/state-schema";
import type { WorldDefinition } from "../world/schema";

export interface ActionReport {
  id: string;
  title: string;
  narrative: string;
  ticks: number;
  costs: Resources;
  gains: Resources;
  net: Resources;
  vehicle: number;
  crew: {
    id: string;
    name: string;
    health: number;
    energy: number;
    joined: boolean;
    status: string;
    xp: number;
    points: number;
  }[];
  discoveries: string[];
  changes: string[];
  combat: string[];
  victory: boolean;
  danger: boolean;
}
export function summarizeTransition(
  before: GameState,
  after: GameState,
  command: GameCommand,
  events: readonly DomainEvent[],
  definition: WorldDefinition,
): ActionReport {
  const oldConvoy = before.convoys[before.player.convoyId];
  const convoy = after.convoys[after.player.convoyId];
  if (!oldConvoy || !convoy) throw new Error("Missing convoy");
  const costs = emptyResources();
  const gains = emptyResources();
  const net = emptyResources();
  for (const event of events) {
    if (
      event.payload.type === "resources.consumed" &&
      event.payload.convoyId === convoy.id
    )
      RESOURCE_IDS.forEach((id) => {
        costs[id] +=
          event.payload.type === "resources.consumed"
            ? event.payload.costs[id]
            : 0;
      });
    if (event.payload.type === "vehicle.repaired")
      costs.scrap += event.payload.scrapCost;
  }
  for (const id of RESOURCE_IDS) {
    net[id] = convoy.resources[id] - oldConvoy.resources[id];
    costs[id] = Math.max(costs[id], -net[id]);
    gains[id] = Math.max(0, net[id] + costs[id]);
  }
  const payload = command.payload;
  const actor =
    "actorId" in payload ? after.actors[payload.actorId] : undefined;
  const skill =
    payload.type === "use-skill"
      ? definition.campaign?.skills.find(
          (entry) => entry.id === payload.skillId,
        )
      : undefined;
  const ascended = events.find(
    (e) => e.payload.type === "actor.ascended",
  )?.payload;
  const title =
    payload.type === "ascend-pathway"
      ? `${actor?.name}: gắn kết bậc ${actor?.pathway?.tier}`
      : payload.type === "travel"
        ? `Đã tới ${definition.locations.find((entry) => entry.id === convoy.locationId)?.name}`
        : payload.type === "investigate"
          ? "Trinh sát hoàn tất"
          : payload.type === "wait"
            ? `Đã nghỉ ${payload.ticks} giờ`
            : payload.type === "repair"
              ? "Xe đã được sửa"
              : payload.type === "train-actor"
                ? `${actor?.name}: nâng ${definition.campaign?.operations?.upgrades.find((entry) => entry.id === payload.upgradeId)?.name}`
                : payload.type === "set-stance"
                  ? `${actor?.name}: ${definition.campaign?.operations?.stances.find((entry) => entry.id === payload.stanceId)?.name}`
                  : payload.type === "use-skill"
                    ? `${actor?.name} dùng ${skill?.name}`
                    : payload.type === "combat"
                      ? `${actor?.name} hành động`
                      : "Lựa chọn đã có kết quả";
  const resolved = events.find(
    (event) => event.payload.type === "event.resolved",
  )?.payload;
  const scout = events.find(
    (event) => event.payload.type === "expedition.scouted",
  )?.payload;
  const rest = events.find(
    (event) => event.payload.type === "expedition.rested",
  )?.payload;
  const narrative =
    ascended?.type === "actor.ascended"
      ? `Đã học ${definition.campaign?.skills.find((s) => s.id === ascended.skillId)?.name}. Nghi thức dùng ${ascended.xpSpent} XP khả dụng và ${ascended.remnantsSpent} di vật cộng hưởng; không trôi giờ.`
      : resolved?.type === "event.resolved"
        ? (definition.campaign?.texts[resolved.outcomeKey] ?? "")
        : scout?.type === "expedition.scouted"
          ? `${definition.campaign?.operations?.recon.find((entry) => entry.locationId === scout.locationId)?.description} Giảm ${scout.riskReductionBps / 100}% rủi ro tuyến rời nơi này đến T${scout.expiresAt}.${scout.firstVisit ? " Cache đã nhận; không thể lấy lại." : " Cache đã lấy trước đó; lần này chỉ làm mới intel."}`
          : rest?.type === "expedition.rested"
            ? rest.healthRestored || rest.energyRestored
              ? `Hồi ${rest.healthRestored} HP và ${rest.energyRestored} năng lượng cho đoàn. Đối thủ vẫn sử dụng thời gian này.`
              : "Đoàn đã đầy sức khỏe và năng lượng: lần chờ này chỉ tiêu khẩu phần và cho đối thủ thời gian hành động."
            : payload.type === "repair"
              ? "Phế liệu được dùng để phục hồi tình trạng xe."
              : payload.type === "train-actor"
                ? "Đã tiêu 1 điểm huấn luyện. Chỉ số tăng vĩnh viễn trong hành trình; không trôi giờ."
                : payload.type === "set-stance"
                  ? "Thế đánh áp dụng ngay cho damage/phòng thủ; không tiêu thời gian."
                  : "Mọi thay đổi bên dưới đã được áp dụng vào đoàn và thế giới.";
  const crew = convoy.actorIds.map((id) => {
    const a = after.actors[id]!;
    const b = before.actors[id];
    return {
      id,
      name: a.name,
      health: a.health - (b?.health ?? a.health),
      energy: (a.energy ?? 0) - (b?.energy ?? a.energy ?? 0),
      joined: !b,
      status: a.status,
      xp: (a.progression?.xp ?? 0) - (b?.progression?.xp ?? 0),
      points: (a.progression?.points ?? 0) - (b?.progression?.points ?? 0),
    };
  });
  const discoveries = after.knowledge.factIds
    .filter((id) => !before.knowledge.factIds.includes(id))
    .map(
      (id) =>
        definition.campaign?.facts.find((fact) => fact.id === id)
          ?.description ?? "Đã khám phá điều mới.",
    );
  const changes: string[] = [];
  for (const instance of Object.values(after.inventory.artifactInstances))
    if (
      before.inventory.artifactInstances[instance.id]?.ownerId !==
      instance.ownerId
    ) {
      const name = definition.campaign?.artifacts.find(
        (entry) => entry.id === instance.artifactId,
      )?.name;
      const previous = before.inventory.artifactInstances[instance.id]?.ownerId;
      const ownerName =
        after.convoys[instance.ownerId]?.vehicle.name ??
        definition.locations.find(
          (location) => location.id === instance.ownerId,
        )?.name ??
        instance.ownerId;
      changes.push(
        instance.ownerId === convoy.id
          ? `Nhận ${name}.`
          : previous === convoy.id
            ? `Giao ${name} cho ${ownerName}.`
            : `${name} đã chuyển sang ${ownerName}.`,
      );
    }
  for (const quest of after.activeQuests)
    if (
      quest.status !== "active" &&
      before.activeQuests.find((entry) => entry.id === quest.id)?.status !==
        quest.status
    ) {
      const template = definition.campaign?.quests.find(
        (entry) => entry.id === quest.templateId,
      );
      changes.push(
        `Nhiệm vụ ${definition.campaign?.texts[template?.titleKey ?? ""] ?? quest.id}: ${quest.status === "failed" ? "thất bại" : quest.status === "alternative" ? "giải pháp thay thế" : "hoàn tất"}.`,
      );
    }
  const rival = definition.campaign?.rival;
  if (
    rival &&
    before.convoys[rival.id]?.locationId !== after.convoys[rival.id]?.locationId
  )
    changes.push("Tro Tàn đã di chuyển trong thời gian bạn hành động.");
  const combat = events.flatMap((event) => {
    const p = event.payload;
    if (p.type === "combat.action")
      return [
        `${after.actors[p.actorId]?.name}: ${p.action === "heal" ? "hồi" : p.action === "defend" ? "phòng thủ" : p.action === "capture" ? "bắt giữ" : "đánh"}${p.targetId ? ` ${after.actors[p.targetId]?.name}` : ""}${p.amount ? ` · ${p.amount} HP` : ""}`,
      ];
    if (p.type === "combat.started")
      return ["TRẬN CHIẾN BẮT ĐẦU — chọn mục tiêu và hành động."];
    if (p.type === "combat.victory")
      return [`CHIẾN THẮNG · ${p.xp} XP cho mỗi người sống. Loot đã vào kho.`];
    if (p.type === "combat.ended")
      return [
        `Trận chiến kết thúc: ${p.result === "victory" ? "đã xử lý hậu chiến" : p.result === "retreat" ? "rút lui thành công" : p.result === "negotiated" ? "đàm phán thành công" : p.result === "surrendered" ? "đã đầu hàng và giao kỳ vật" : "thất bại"}.`,
      ];
    return [];
  });
  return {
    id: command.id,
    title,
    narrative,
    ticks: after.world.tick - before.world.tick,
    costs,
    gains,
    net,
    vehicle: convoy.vehicle.condition - oldConvoy.vehicle.condition,
    crew,
    discoveries,
    changes,
    combat,
    victory: events.some((event) => event.payload.type === "combat.victory"),
    danger:
      crew.some((entry) => entry.health < 0) ||
      convoy.vehicle.condition < oldConvoy.vehicle.condition,
  };
}

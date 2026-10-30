import { CommandError } from "../core/commands";
import type { GameCommand } from "../core/commands";
import type { GameState } from "../core/state-schema";
import type { WorldDefinition } from "../world/schema";
import type { Emit } from "../narrative/effects";
import { establishFact } from "../core/facts";
import { awardExperience } from "../expedition/progression";
import { canAfford, supplyCosts } from "../core/resources";
import { emptyResources, RESOURCE_IDS } from "../core/primitives";
import {
  cellKey,
  distance,
  passable,
  protectedByLight,
  shadowStep,
  vectors,
  visibleCells,
} from "./geometry";
import type { Expedition, FieldSite } from "./schema";
export type FieldPayload = Extract<
  GameCommand["payload"],
  { type: "field-enter" | "field-step" | "field-interact" | "field-exit" }
>;
function fail(message: string): never {
  throw new CommandError("REQUIREMENTS_NOT_MET", message);
}
export function fieldEntryReason(
  state: GameState,
  site: FieldSite,
  actorId: string,
  def?: WorldDefinition,
) {
  const a = state.actors[actorId];
  return !a || a.convoyId !== state.player.convoyId || a.status !== "active"
    ? "Cần một thành viên còn hoạt động của đoàn."
    : state.convoys[state.player.convoyId]?.locationId !== site.locationId
      ? "Đoàn chưa tới lối vào khu vực."
      : state.combat ||
          state.fieldwork?.expedition?.phase === "active" ||
          (state.scenario && !state.scenario.installedModuleId)
        ? "Hãy hoàn tất nhiệm vụ/giao chiến đang có."
        : state.fieldwork?.completedSiteIds.includes(site.id)
          ? "Đoàn đã xuất kích tại khu vực này."
          : site.requiresKnowledge.some(
                (id) => !state.knowledge.factIds.includes(id),
              )
            ? "Cần xác minh quy tắc tại bệnh viện trước khi vào."
            : def &&
                !canAfford(
                  state.convoys[state.player.convoyId]!.resources,
                  supplyCosts(
                    state,
                    state.convoys[state.player.convoyId]!,
                    site.reserveHours + 1,
                    def,
                  ),
                )
              ? "Cần khẩu phần cho ca xuất kích và một giờ dự trữ."
              : "";
}
function journal(e: Expedition, text: string) {
  e.log = [...e.log, text].slice(-8);
}
function finish(
  state: GameState,
  site: FieldSite,
  e: Expedition,
  rescue: boolean,
  def: WorldDefinition,
  emit: Emit,
) {
  const field = state.fieldwork!,
    convoy = state.convoys[state.player.convoyId]!,
    actor = state.actors[e.actorId]!;
  if (field.completedSiteIds.includes(site.id))
    fail("Chuyến xuất kích đã quyết toán.");
  const rewards = emptyResources();
  if (rescue) {
    actor.health = Math.max(0, actor.health - site.rescueDamage);
    if (!actor.health) actor.status = "downed";
    convoy.vehicle.condition = Math.max(
      0,
      convoy.vehicle.condition - site.rescueVehicleCost,
    );
    e.cargo = [];
    journal(
      e,
      "Dây kéo căng lên. Đội giữ xe đưa bạn ra ngoài; hàng mang theo phải bỏ lại.",
    );
  } else
    for (const id of e.cargo) {
      const item = site.objects.find((o) => o.id === id)?.reward;
      if (!item) throw new Error("Missing field reward");
      for (const r of RESOURCE_IDS) {
        rewards[r] += item.resources[r];
        if (convoy.resources[r] + item.resources[r] > 1_000_000)
          fail("Kho vật tư vượt sức chứa.");
        convoy.resources[r] += item.resources[r];
      }
      if (item.factId) establishFact(state, item.factId, true);
      awardExperience(state, item.xp, def, emit);
      state.campaign!.occultRemnants =
        (state.campaign!.occultRemnants ?? 0) + item.remnants;
    }
  e.phase = rescue ? "rescued" : "returned";
  e.cue = "exit";
  field.completedSiteIds.push(site.id);
  establishFact(state, site.completedFactId, true);
  emit({
    type: "field.event",
    siteId: site.id,
    action: rescue ? "rescue" : "return",
    cue: e.cue,
    detail: rescue
      ? "Rút khẩn cấp; bỏ hàng, người và xe chịu thiệt hại."
      : "Đã về xe. Vật tư và hồ sơ trong túi đã chuyển về đoàn.",
    rewards,
  });
}
function advance(
  state: GameState,
  site: FieldSite,
  e: Expedition,
  noise: number,
  def: WorldDefinition,
  emit: Emit,
  batteryCost = 1,
) {
  e.beat++;
  e.noise = noise;
  e.cue = "quiet";
  const safe = protectedByLight(site, e);
  if (noise > 0) {
    if (safe) {
      e.cue = "light";
      if (e.observations === 1) {
        e.observations = 2;
        journal(
          e,
          "Tiếng chân vang lên trong ánh sáng. Cái bóng vẫn đứng yên.",
        );
      }
    } else {
      const previous = cellKey(e.shadow);
      for (let n = 0; n < Math.min(3, noise); n++) {
        e.shadow = shadowStep(site, e);
        if (distance(e.shadow, e.position) === 0) break;
      }
      if (previous !== cellKey(e.shadow)) {
        e.cue = "advance";
        e.observations = Math.max(1, e.observations);
        journal(e, "Có tiếng kéo lê đáp lại bước chân. Bóng tối vừa ngắn đi.");
      } else {
        e.cue = "knock";
        journal(e, "Từ sau cánh cửa đóng, có tiếng gõ đáp lại.");
      }
    }
  }
  if (e.torch && e.battery > 0)
    e.battery = Math.max(0, e.battery - batteryCost);
  if (
    e.observations >= 2 &&
    !state.knowledge.factIds.includes(site.ruleFactId)
  ) {
    e.observations = 3;
    establishFact(state, site.ruleFactId, true);
    journal(
      e,
      "Ghi nhận: tiếng động trong vùng tối gọi bóng lại gần; ánh sáng giữ nó đứng yên.",
    );
  }
  if (distance(e.shadow, e.position) === 0) {
    const a = state.actors[e.actorId]!;
    a.health = Math.max(0, a.health - site.shadowDamage);
    if (!a.health) a.status = "downed";
    e.strikes++;
    e.cue = "hit";
    e.shadow = { ...site.shadowStart };
    e.position = { ...site.start };
    const dropped = e.cargo.pop();
    journal(
      e,
      `Một bàn tay lạnh túm lấy vai. Bạn lùi về vệt đèn cửa ra${dropped ? ", đánh rơi một món đồ" : ""}.`,
    );
    if (a.status !== "active") {
      finish(state, site, e, true, def, emit);
      return;
    }
  }
  const known = new Set(e.seen);
  visibleCells(site, e).forEach((p) => known.add(cellKey(p)));
  e.seen = [...known].sort();
  if (e.beat >= site.maxBeats) {
    journal(e, "Hết ca giữ xe. Sợi dây cứu hộ giật căng.");
    finish(state, site, e, true, def, emit);
  }
}
export function resolveFieldCommand(
  state: GameState,
  p: FieldPayload,
  def: WorldDefinition,
  emit: Emit,
) {
  const config = def.campaign?.fieldwork;
  if (!config || !state.fieldwork)
    fail("Hành trình này chưa có xuất kích trực tiếp.");
  if (p.type === "field-enter") {
    const site = config.sites.find((s) => s.id === p.siteId);
    if (!site) fail("Khu vực không tồn tại.");
    // The processor has already checked the entry buffer and charged the shift.
    const reason = fieldEntryReason(state, site, p.actorId);
    if (reason) fail(reason);
    const e: Expedition = {
      siteId: site.id,
      actorId: p.actorId,
      phase: "active",
      position: { ...site.start },
      shadow: { ...site.shadowStart },
      facing: "east",
      beat: 0,
      torch: true,
      battery: site.battery,
      openDoors: [],
      collected: [],
      cargo: [],
      seen: [],
      observations: 0,
      noise: 0,
      strikes: 0,
      cue: "knock",
      log: ["Đội giữ xe neo dây ở cửa. Từ phòng bên, có tiếng gõ đáp lại."],
    };
    e.seen = visibleCells(site, e).map(cellKey).sort();
    state.fieldwork.expedition = e;
    emit({
      type: "field.event",
      siteId: site.id,
      action: "enter",
      cue: e.cue,
      detail:
        "Đã dự trù ca xuất kích. Di chuyển theo bước; đứng yên dừng nhịp nhiệm vụ.",
      rewards: emptyResources(),
    });
    return;
  }
  const e = state.fieldwork.expedition;
  if (!e || e.phase !== "active")
    fail("Không có chuyến xuất kích đang hoạt động.");
  const site = config.sites.find((s) => s.id === e.siteId)!;
  if (p.type === "field-exit") {
    if (!p.rescue && distance(e.position, site.start) > 1)
      fail("Cần quay lại cửa ra để mang hàng về xe.");
    finish(state, site, e, p.rescue, def, emit);
    return;
  }
  let noise = 0;
  if (p.type === "field-step") {
    if (p.action === "torch") {
      if (!e.battery && !e.torch)
        fail("Đèn đã cạn pin. Tìm vùng đèn cố định hoặc quay về cửa ra.");
      e.torch = !e.torch;
      journal(e, e.torch ? "Bật đèn pin." : "Tắt đèn để giữ pin.");
    } else if (p.action === "wait") {
      noise = 0;
    } else {
      const v = vectors[p.direction!];
      if (!v) fail("Chọn hướng di chuyển.");
      e.facing = p.direction!;
      let moved = 0;
      for (let n = 0; n < (p.run ? 2 : 1); n++) {
        const next = { x: e.position.x + v.x, y: e.position.y + v.y };
        if (!passable(site, e, next)) break;
        e.position = next;
        moved++;
        if (distance(e.position, e.shadow) === 0) break;
      }
      if (!moved) fail("Lối này bị tường hoặc cửa chặn.");
      noise = p.run ? 3 : 1;
    }
  } else {
    const object = site.objects.find((o) => o.id === p.objectId);
    if (!object || distance(object.position, e.position) > 1)
      fail("Cần đứng cạnh vật để tương tác.");
    if (object.kind === "exit") {
      finish(state, site, e, false, def, emit);
      return;
    }
    if (object.kind === "door") {
      if (e.openDoors.includes(object.id)) {
        if (
          distance(object.position, e.position) === 0 ||
          distance(object.position, e.shadow) === 0
        )
          fail("Không thể đóng cửa khi đang đứng ở ngưỡng.");
        e.openDoors = e.openDoors.filter((id) => id !== object.id);
      } else e.openDoors.push(object.id);
      journal(
        e,
        `${e.openDoors.includes(object.id) ? "Mở" : "Đóng"} ${object.name}.`,
      );
    } else {
      if (e.collected.includes(object.id)) fail("Nơi này đã lục soát.");
      if (e.cargo.length >= site.capacity)
        fail("Túi đã đầy. Mang đồ về hoặc chọn rút.");
      e.collected.push(object.id);
      e.cargo.push(object.id);
      journal(e, object.description);
    }
    noise = object.noise;
  }
  advance(
    state,
    site,
    e,
    noise,
    def,
    emit,
    p.type === "field-step" && p.action === "move" && p.run ? 2 : 1,
  );
  emit({
    type: "field.event",
    siteId: site.id,
    action: p.type === "field-step" ? p.action : "interact",
    cue: e.cue,
    detail: e.log.at(-1) ?? "Một nhịp qua đi.",
    rewards: emptyResources(),
  });
}

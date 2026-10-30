import type { resolveScenarioCommand } from "./legacy-engine";
import { CommandError } from "../core/commands";
import { canAfford, subtractResources } from "../core/resources";
import { RESOURCE_IDS } from "../core/primitives";
import { establishFact } from "../core/facts";
import { createActor } from "../core/actors";
import { initializeProgression } from "../expedition/progression";
import { startCombat } from "../combat/engine";
function fail(message: string): never {
  throw new CommandError("REQUIREMENTS_NOT_MET", message);
}
/** Versioned, configured scenario operators. Legacy saves retain their original resolver. */
export const resolveFieldScenario: typeof resolveScenarioCommand = (
  state,
  p,
  def,
  emit,
) => {
  const cfg = def.campaign!.fieldwork!,
    convoy = state.convoys[state.player.convoyId]!;
  const config = cfg.scenarios.find(
    (s) =>
      s.id ===
      (p.type === "scenario-start" ? p.scenarioId : state.scenario?.id),
  );
  if (!config) fail("Nhiệm vụ không tồn tại.");
  const role = (ids: string[], wanted: string) =>
    ids.some((id) =>
      cfg.roles.some((r) => r.actorId === id && r.role === wanted),
    );
  if (p.type === "scenario-start") {
    if (state.scenario)
      fail("Chuyến xuất kích tại đây đã được bắt đầu hoặc quyết toán.");
    if (
      convoy.locationId !== config.locationId ||
      state.world.facts[config.completionFactId]?.value
    )
      fail("Nhiệm vụ không còn khả dụng tại địa điểm này.");
    const crew = [...p.scoutIds, p.guardId];
    if (
      p.scoutIds.length !== 2 ||
      new Set(crew).size !== 3 ||
      crew.some(
        (id) =>
          !convoy.actorIds.includes(id) ||
          state.actors[id]?.status !== "active",
      )
    )
      fail(
        "Cần hai người xuất kích và một người giữ xe khác nhau, còn hoạt động.",
      );
    state.scenario = {
      id: config.id,
      phase: "exploring",
      scoutIds: [...p.scoutIds],
      guardId: p.guardId,
      currentNodeId: config.startNodeId,
      visitedNodeIds: [config.startNodeId],
      completedActionIds: [],
      alert: 0,
      maxAlert: 6,
      powerOn: false,
      rescuedHa: false,
      cargo: [],
      maxCargo: 2,
      installedModuleId: null,
      log: [
        `Đội xuất kích rời xe; khẩu phần và ca ${config.durationHours} giờ đã được dự trù.`,
      ],
    };
  } else {
    const s = state.scenario;
    if (!s || s.installedModuleId)
      fail("Nhiệm vụ đã quyết toán hoặc chưa bắt đầu.");
    if (p.type === "scenario-move") {
      if (s.phase !== "exploring")
        fail("Cần xử lý khủng hoảng trước khi di chuyển.");
      const current = config.nodes.find((n) => n.id === s.currentNodeId);
      if (!current?.connectedNodeIds.includes(p.targetNodeId))
        fail("Lối đi không nối với vị trí hiện tại.");
      s.currentNodeId = p.targetNodeId;
      if (!s.visitedNodeIds.includes(p.targetNodeId))
        s.visitedNodeIds.push(p.targetNodeId);
      s.log.push(
        `Di chuyển tới ${config.nodes.find((n) => n.id === p.targetNodeId)!.name}.`,
      );
      if (
        p.targetNodeId === config.startNodeId &&
        (s.cargo.length || s.rescuedHa) &&
        s.alert >= 2
      )
        s.phase = "crisis";
    } else if (p.type === "scenario-act") {
      if (s.phase !== "exploring" || s.currentNodeId !== p.nodeId)
        fail("Cần tới đúng vị trí và đang khám phá.");
      const a = config.nodes
        .find((n) => n.id === p.nodeId)
        ?.actions.find((a) => a.id === p.actionId);
      if (!a || s.completedActionIds.includes(a.id))
        fail("Hành động không tồn tại hoặc đã hoàn tất.");
      if (a.requiredRole && !role(s.scoutIds, a.requiredRole))
        fail("Đội xuất kích thiếu vai trò cần thiết.");
      if (a.costs && !canAfford(convoy.resources, a.costs))
        fail("Không đủ vật tư; chưa thực hiện hành động.");
      if (
        s.cargo.length +
          (a.effects?.filter((e) => e.op === "cargo").length ?? 0) >
        s.maxCargo
      )
        fail("Ba-lô đã đầy.");
      if (a.costs)
        convoy.resources = subtractResources(convoy.resources, a.costs);
      for (const effect of a.effects ?? []) {
        if (effect.op === "power") s.powerOn = true;
        else if (effect.op === "cargo") s.cargo.push(effect.itemId);
        else if (effect.op === "resources")
          for (const r of RESOURCE_IDS) {
            if (convoy.resources[r] + effect.amounts[r] > 1_000_000)
              fail("Kho vật tư vượt giới hạn.");
            convoy.resources[r] += effect.amounts[r];
          }
        else {
          s.rescuedHa = true;
          if (!s.powerOn && !role(s.scoutIds, effect.quietRole))
            s.alert += effect.forcedNoise;
        }
      }
      if (a.factId) establishFact(state, a.factId, true);
      s.alert = Math.min(s.maxAlert, s.alert + a.alertCost);
      s.completedActionIds.push(a.id);
      s.log.push(a.name);
      if (s.alert >= 4) s.phase = "crisis";
    } else if (p.type === "scenario-crisis") {
      if (
        s.phase !== "crisis" &&
        (p.method !== "evacuate" || s.phase !== "exploring")
      )
        fail("Không thể xử lý khủng hoảng ở giai đoạn này.");
      if (p.method === "combat") {
        startCombat(state, config.enemyConvoyId, false, emit, def);
        s.phase = "completed";
      } else if (p.method === "decoy") {
        if (s.cargo.length) s.cargo.pop();
        else if (convoy.resources.fuel >= 2) convoy.resources.fuel -= 2;
        else fail("Cần một kiện hàng hoặc hai xăng làm nghi binh.");
        s.phase = "completed";
      } else {
        s.cargo = [];
        convoy.vehicle.condition = Math.max(0, convoy.vehicle.condition - 10);
        s.phase = "evacuated";
      }
      s.log.push("Đội rút khỏi vùng bao vây.");
    } else if (p.type === "scenario-finish") {
      if (
        s.phase !== "completed" &&
        s.phase !== "evacuated" &&
        !(s.phase === "exploring" && s.currentNodeId === config.startNodeId)
      )
        fail("Cần về bãi xe hoặc hoàn tất khủng hoảng.");
      for (const id of s.cargo) {
        const rewards = config.cargoRewards[id];
        if (!rewards) throw new Error("Unknown cargo");
        for (const r of RESOURCE_IDS) {
          if (convoy.resources[r] + rewards[r] > 1_000_000)
            fail("Kho vượt giới hạn.");
          convoy.resources[r] += rewards[r];
        }
      }
      s.cargo = [];
      if (s.rescuedHa && !convoy.actorIds.includes(config.rescuedActorId)) {
        const character = def.characters.find(
          (c) => c.id === config.rescuedActorId,
        )!;
        state.actors[character.id] = createActor(character, convoy.id, true);
        initializeProgression(state.actors[character.id]!, def);
        convoy.actorIds.push(character.id);
        establishFact(state, "story.rescued", true);
      }
      s.installedModuleId = p.chosenModuleId;
      s.phase = "completed";
      establishFact(state, "module.installed", p.chosenModuleId);
      establishFact(state, config.completionFactId, true);
      s.log.push(
        "Đã chuyển hàng về kho và lắp module. Chuyến xuất kích đã quyết toán.",
      );
    }
  }
  emit({
    type: "scenario.event",
    scenarioId: config.id,
    action: p.type,
    detail: state.scenario?.log.at(-1) ?? "Đội đang xuất kích.",
  });
};

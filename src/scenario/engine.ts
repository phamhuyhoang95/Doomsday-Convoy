import { CommandError } from "../core/commands";
import type { GameCommand } from "../core/commands";
import type { GameState } from "../core/state-schema";
import type { WorldDefinition } from "../world/schema";
import type { DomainEventPayload } from "../core/events";
import { marketBlackoutScenario } from "../content/scenarios";
import { startCombat } from "../combat/engine";
import { createActor } from "../core/actors";
import { initializeProgression } from "../expedition/progression";

type Emit = (payload: DomainEventPayload) => void;

export function resolveScenarioCommand(
  state: GameState,
  payload: Extract<
    GameCommand["payload"],
    {
      type:
        | "scenario-start"
        | "scenario-move"
        | "scenario-act"
        | "scenario-crisis"
        | "scenario-finish";
    }
  >,
  definition: WorldDefinition,
  emit: Emit,
): void {
  const convoy = state.convoys[payload.convoyId];
  if (!convoy)
    throw new CommandError("UNKNOWN_CONVOY", "Convoy does not exist.");

  switch (payload.type) {
    case "scenario-start": {
      if (state.scenario && state.scenario.phase !== "completed" && state.scenario.phase !== "evacuated") {
        throw new CommandError("SCENARIO_ACTIVE", "Scenario is already active.");
      }
      if (convoy.locationId !== "location.market") {
        throw new CommandError("INVALID_LOCATION", "Convoy is not at scenario location.");
      }
      const scouts = payload.scoutIds;
      const guard = payload.guardId;
      if (scouts.length !== 2) {
        throw new CommandError("INVALID_CREW", "Exactly 2 scouts must be selected.");
      }
      if (scouts.includes(guard)) {
        throw new CommandError("INVALID_CREW", "Guard cannot be a scout.");
      }
      const allCrew = [...scouts, guard];
      for (const id of allCrew) {
        if (!convoy.actorIds.includes(id)) {
          throw new CommandError("INVALID_CREW", `Actor ${id} is not in convoy.`);
        }
        const actor = state.actors[id];
        if (!actor || actor.status !== "active") {
          throw new CommandError("INVALID_CREW", `Actor ${id} is not active.`);
        }
      }

      state.scenario = {
        id: payload.scenarioId,
        phase: "exploring",
        scoutIds: scouts,
        guardId: guard,
        currentNodeId: "node.parking",
        visitedNodeIds: ["node.parking"],
        completedActionIds: [],
        alert: 0,
        maxAlert: 6,
        powerOn: false,
        rescuedHa: false,
        cargo: [],
        maxCargo: 2,
        installedModuleId: null,
        log: ["Đoàn xe tới bãi đỗ chợ. Đội thám hiểm tiến vào bóng tối."],
      };

      emit({
        type: "scenario.event",
        scenarioId: payload.scenarioId,
        action: "start",
        detail: "Bắt đầu đột kích chợ.",
      });
      break;
    }

    case "scenario-move": {
      const scenario = state.scenario;
      if (!scenario || scenario.phase !== "exploring") {
        throw new CommandError("NO_SCENARIO", "Not currently exploring scenario.");
      }
      const def = marketBlackoutScenario;
      const current = def.nodes.find((n) => n.id === scenario.currentNodeId);
      if (!current || !current.connectedNodeIds.includes(payload.targetNodeId)) {
        throw new CommandError("INVALID_MOVE", "Target node is not connected to current node.");
      }

      scenario.currentNodeId = payload.targetNodeId;
      if (!scenario.visitedNodeIds.includes(payload.targetNodeId)) {
        scenario.visitedNodeIds.push(payload.targetNodeId);
      }

      const target = def.nodes.find((n) => n.id === payload.targetNodeId);
      scenario.log.push(`Đội thám hiểm di chuyển tới: ${target?.name ?? payload.targetNodeId}`);

      // Check if moving back to parking with Ha or full Cargo while alert is elevated -> triggers crisis
      if (
        payload.targetNodeId === "node.parking" &&
        (scenario.rescuedHa || scenario.cargo.length > 0) &&
        scenario.alert >= 2
      ) {
        scenario.phase = "crisis";
        scenario.log.push("BÓNG ĐÈN QUÉT TỚI! Toán cướp kho phát hiện tiếng động và chặn cửa bãi xe!");
      }

      emit({
        type: "scenario.event",
        scenarioId: scenario.id,
        action: "move",
        detail: `Di chuyển tới ${payload.targetNodeId}`,
      });
      break;
    }

    case "scenario-act": {
      const scenario = state.scenario;
      if (!scenario || scenario.phase !== "exploring") {
        throw new CommandError("NO_SCENARIO", "Not currently exploring scenario.");
      }
      if (scenario.currentNodeId !== payload.nodeId) {
        throw new CommandError("INVALID_NODE", "Action is not at current node.");
      }
      if (scenario.completedActionIds.includes(payload.actionId)) {
        throw new CommandError("ACTION_ALREADY_DONE", "Action has already been completed.");
      }

      const def = marketBlackoutScenario;
      const node = def.nodes.find((n) => n.id === payload.nodeId);
      const action = node?.actions.find((a) => a.id === payload.actionId);
      if (!action) {
        throw new CommandError("UNKNOWN_ACTION", "Action does not exist on this node.");
      }

      // Check role requirement
      if (action.requiredRole) {
        const hasRole = scenario.scoutIds.some(
          (id) => state.actors[id]?.role.toLowerCase().includes("thợ máy") ||
                  state.actors[id]?.role.toLowerCase().includes("mechanic"),
        );
        if (!hasRole) {
          throw new CommandError("ROLE_REQUIRED", `Action requires role: ${action.requiredRole}`);
        }
      }

      scenario.completedActionIds.push(action.id);
      scenario.alert = Math.min(scenario.maxAlert, scenario.alert + action.alertCost);

      if (action.id === "act.scout-stalls") {
        scenario.log.push("Minh phát hiện dấu chân toán cướp tập trung ở kho hàng phía đông. Buồng quản lý bị khóa sau cổng điện.");
      } else if (action.id === "act.loot-stalls") {
        convoy.resources.food += 3;
        convoy.resources.water += 3;
        scenario.log.push("Thu nhặt được 3 phần lương khô và 3 chai nước sạch.");
      } else if (action.id === "act.start-generator") {
        scenario.powerOn = true;
        scenario.log.push("TIẾNG MÁY DIESEL NỔ VANG! Đèn chợ bừng sáng, toàn bộ cửa điện tự động bật mở! (+2 Cảnh giới)");
      } else if (action.id === "act.wire-silently") {
        scenario.powerOn = true;
        convoy.resources.scrap = Math.max(0, convoy.resources.scrap - 1);
        scenario.log.push("Bảo khéo léo nối tắt rơ-le điện ngầm. Cửa từ mở êm ả mà không phát ra một tiếng động.");
      } else if (action.id === "act.take-fuel" || action.id === "act.take-scrap" || action.id === "act.take-generator") {
        if (scenario.cargo.length >= scenario.maxCargo) {
          throw new CommandError("CARGO_FULL", "Ba-lô đã đầy, tối đa chỉ mang được 2 kiện hàng.");
        }
        if (action.itemReward) {
          scenario.cargo.push(action.itemReward);
          scenario.log.push(`Đã vác lên vai: ${action.name}.`);
        }
      } else if (action.id === "act.rescue-ha") {
        scenario.rescuedHa = true;
        if (scenario.powerOn) {
          scenario.log.push("Nhấn công tắc điện, cửa cuốn sắt trượt lên! Hà chạy ra ôm chầm lấy Lan trong nước mắt.");
        } else {
          const hasBao = scenario.scoutIds.includes("character.bao");
          if (hasBao) {
            scenario.log.push("Bảo dùng thanh sắt cạy nhẹ chốt khóa cơ, giải thoát cho Hà trong êm đẹp.");
          } else {
            scenario.alert = Math.min(scenario.maxAlert, scenario.alert + 2);
            scenario.log.push("Minh dùng xà-beng phá mạnh cửa sắt! Tiếng kim loại rít lên inh ỏi (+2 Cảnh giới), Hà được cứu thoát.");
          }
        }
      }

      // If alert reaches 4 or higher, crisis immediately triggers!
      if (scenario.alert >= 4) {
        scenario.phase = "crisis";
        scenario.log.push("TIẾNG CÒI BÁO ĐỘNG! Toán cướp kho phát hiện tiếng ồn và ùa ra bao vây!");
      }

      emit({
        type: "scenario.event",
        scenarioId: scenario.id,
        action: action.id,
        detail: action.name,
      });
      break;
    }

    case "scenario-crisis": {
      const scenario = state.scenario;
      if (!scenario || (scenario.phase !== "crisis" && payload.method !== "evacuate")) {
        throw new CommandError("NO_CRISIS", "No active crisis in scenario.");
      }

      if (payload.method === "combat") {
        scenario.log.push("Minh giơ súng ra hiệu! Đội thám hiểm nổ súng áp chế toán cướp!");
        // Start combat with scavenger encounter
        startCombat(state, "convoy.scavengers", false, emit);
        // Scenario phase becomes completed once combat finishes
        scenario.phase = "completed";
      } else if (payload.method === "decoy") {
        if (scenario.cargo.length > 0) {
          const dropped = scenario.cargo.pop();
          scenario.log.push(`Ném ${dropped} sang cổng phụ làm mồi nhử! Toán cướp bị lừa đuổi theo, cả đội lẻn về bãi xe an toàn.`);
        } else if (convoy.resources.fuel >= 2) {
          convoy.resources.fuel -= 2;
          scenario.log.push("Đốt cháy vệt xăng tạo rèm lửa đánh lạc hướng! Toán cướp dạt ra, cả đội rút về xe an toàn.");
        } else {
          throw new CommandError("NO_DECOY_SUPPLIES", "Không có kiện hàng hoặc đủ 2 xăng để làm mồi nhử.");
        }
        scenario.phase = "completed";
      } else if (payload.method === "evacuate") {
        scenario.cargo = [];
        convoy.vehicle.condition = Math.max(10, convoy.vehicle.condition - 10);
        scenario.phase = "evacuated";
        scenario.log.push("Rút lui khẩn cấp! Bỏ lại toàn bộ hàng cồng kềnh, xe nhấn ga húc đổ rào chắn thoát thân (-10% Độ bền xe).");
      }

      emit({
        type: "scenario.event",
        scenarioId: scenario.id,
        action: `crisis-${payload.method}`,
        detail: `Giải quyết khủng hoảng bằng ${payload.method}`,
      });
      break;
    }

    case "scenario-finish": {
      const scenario = state.scenario;
      if (
        !scenario ||
        (scenario.phase !== "completed" &&
          scenario.phase !== "evacuated" &&
          scenario.currentNodeId !== "node.parking")
      ) {
        throw new CommandError("NOT_READY", "Scenario is not yet ready to finish.");
      }

      // Convert cargo into actual resources
      for (const item of scenario.cargo) {
        if (item === "cargo.fuel") {
          convoy.resources.fuel += 15;
        } else if (item === "cargo.scrap") {
          convoy.resources.scrap += 10;
        } else if (item === "cargo.generator") {
          convoy.resources.fuel += 10;
          convoy.resources.scrap += 10;
        }
      }

      // Ha joins convoy permanently if rescued
      if (scenario.rescuedHa && !convoy.actorIds.includes("character.ha")) {
        const character = definition.characters.find(
          (entry) => entry.id === "character.ha",
        );
        if (character && !state.actors["character.ha"]) {
          state.actors["character.ha"] = createActor(character, convoy.id, true);
          initializeProgression(state.actors["character.ha"]!, definition);
        }
        convoy.actorIds.push("character.ha");
        state.world.facts["story.rescued"] = {
          value: true,
          establishedAt: state.world.tick,
        };
      }

      // Install vehicle module
      scenario.installedModuleId = payload.chosenModuleId;
      state.world.facts["module.installed"] = {
        value: payload.chosenModuleId,
        establishedAt: state.world.tick,
      };

      // Mark market cache secured
      state.world.facts["cache.secured"] = {
        value: true,
        establishedAt: state.world.tick,
      };

      // Advance world time by 2 ticks (the expedition duration)
      state.world.tick += 2;
      convoy.resources.food = Math.max(0, convoy.resources.food - 6);
      convoy.resources.water = Math.max(0, convoy.resources.water - 6);

      scenario.phase = "completed";
      scenario.log.push(`Đoàn xe xuất kích tiếp tục hành trình! Đã lắp module: ${payload.chosenModuleId}.`);

      emit({
        type: "scenario.event",
        scenarioId: scenario.id,
        action: "finish",
        detail: `Hoàn tất scenario với module ${payload.chosenModuleId}`,
      });
      break;
    }
  }
}

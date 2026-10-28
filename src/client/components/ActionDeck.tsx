import type { GameCommand } from "../../core/commands";
import type { GameState } from "../../core/state-schema";
import { operationPreview } from "../../expedition/read-model";
import { useDefinition } from "../definition";
import { Costs } from "./shared";

export function ActionDeck({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: (payload: GameCommand["payload"]) => void;
}) {
  const definition = useDefinition();
  if (
    !definition.campaign?.operations ||
    state.status !== "active" ||
    state.combat
  )
    return null;
  const scout = operationPreview(state, "investigate", definition);
  const rest = operationPreview(state, "wait", definition);
  const repair = operationPreview(state, "repair", definition);
  return (
    <section className="command-deck" aria-label="Hành động đoàn xe">
      <button
        disabled={!scout.enabled}
        title={scout.reason || scout.profile?.description}
        onClick={() =>
          dispatch({ type: "investigate", convoyId: state.player.convoyId })
        }
      >
        <span className="action-glyph">⌖</span>
        <span>
          <strong>Trinh sát</strong>
          <small>
            {scout.remainingIntel
              ? `Intel còn ${scout.remainingIntel}h · cache đã lấy`
              : scout.cacheAvailable
                ? "Cache +3 XP · giảm 50% rủi ro / 5h"
                : "Làm mới intel · không nhận lại cache"}
          </small>
          <Costs resources={scout.costs} />
        </span>
        <b>1h</b>
      </button>
      <button
        disabled={!rest.enabled}
        title={rest.reason || "Đối thủ vẫn di chuyển trong khi bạn nghỉ."}
        onClick={() =>
          dispatch({ type: "wait", convoyId: state.player.convoyId, ticks: 1 })
        }
      >
        <span className="action-glyph">☽</span>
        <span>
          <strong>Nghỉ & canh gác</strong>
          <small>
            {rest.health || rest.energy
              ? `Hồi +${rest.health} HP · +${rest.energy} NL toàn đoàn`
              : "Đoàn đã khỏe · chỉ chờ đối thủ / thời gian"}
          </small>
          <Costs resources={rest.costs} />
        </span>
        <b>1h</b>
      </button>
      <button
        disabled={!repair.enabled}
        title={repair.reason || "Sửa xe trước khi mạo hiểm tuyến đường."}
        onClick={() =>
          dispatch({ type: "repair", convoyId: state.player.convoyId })
        }
      >
        <span className="action-glyph">⚒</span>
        <span>
          <strong>Sửa xe</strong>
          <small>
            {repair.condition
              ? `+${repair.condition} tình trạng · tốn ${definition.campaign.operations.repair.scrapCost} phế liệu`
              : "Xe đang nguyên vẹn"}
          </small>
          <Costs resources={repair.costs} />
        </span>
        <b>1h</b>
      </button>
    </section>
  );
}

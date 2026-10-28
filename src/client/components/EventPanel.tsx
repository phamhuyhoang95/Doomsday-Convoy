import { useDefinition } from "../definition";
import type { GameCommand } from "../../core/commands";
import type { GameState } from "../../core/state-schema";
import { choiceAvailability } from "../../narrative/read-model";
import { Costs } from "./shared";
import { evaluateCondition } from "../../narrative/conditions";
import { AssetArt } from "./AssetArt";
import {
  choiceOutcomePreview,
  choiceTotalCosts,
} from "../../read-models/effects";

export function EventPanel({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: (payload: GameCommand["payload"]) => void;
}) {
  const definition = useDefinition();
  const instance = state.activeEvents[0];
  const event = definition.campaign?.events.find(
    (entry) => entry.id === instance?.eventId,
  );
  const location = definition.locations.find(
    (entry) => entry.id === state.convoys[state.player.convoyId]?.locationId,
  );
  const text = (key: string) => definition.campaign?.texts[key] ?? key;
  return (
    <aside className="panel event-panel">
      <AssetArt
        id={`asset.${event?.id ?? location?.id ?? "unknown"}`}
        kind={event ? "event" : "location"}
        label={event ? text(event.titleKey) : (location?.name ?? "Địa điểm")}
      />
      <div className="event-body">
        <p className="eyebrow">
          {event ? "TÌNH HUỐNG" : "TRINH SÁT"} / {location?.name}
        </p>
        <h2>{event ? text(event.titleKey) : "Khoảng lặng trên đường"}</h2>
        <p className="narrative">
          {event
            ? text(
                event.variants.find((variant) =>
                  evaluateCondition(state, variant.when),
                )?.textKey ?? event.textKey,
              )
            : location?.description}
        </p>
        {event && instance ? (
          <div className="choices">
            {event.choices.map((choice, index) => {
              const availability = choiceAvailability(
                state,
                choice,
                definition,
              );
              const preview = choiceOutcomePreview(choice, definition);
              const isCombat = choice.outcomes.some((outcome) =>
                outcome.effects.some((effect) => effect.op === "combat"),
              );
              return (
                <button
                  key={choice.id}
                  className={`choice ${isCombat ? "combat-choice" : ""}`}
                  disabled={!availability.enabled}
                  title={availability.reason}
                  onClick={() =>
                    dispatch({
                      type: "choose",
                      convoyId: state.player.convoyId,
                      instanceId: instance.instanceId,
                      choiceId: choice.id,
                    })
                  }
                >
                  <span className="choice-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <strong>{text(choice.labelKey)}</strong>
                    <span className="choice-cost-label">
                      Tổng chi (kể cả khẩu phần){" "}
                      <Costs
                        resources={choiceTotalCosts(state, choice, definition)}
                      />
                    </span>
                    <span className="choice-effect-list">
                      {preview.map((outcome, i) => (
                        <span key={i}>
                          <b>
                            {preview.length > 1
                              ? `${outcome.chance}%: `
                              : "Hệ quả: "}
                          </b>
                          {outcome.effects.join(" · ")}
                        </span>
                      ))}
                    </span>
                    <small>
                      {availability.enabled
                        ? "1 giờ · khẩu phần của đoàn"
                        : availability.reason}
                    </small>
                  </span>
                  <span className="choice-arrow">↗</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="quiet-note">
            Chọn một tuyến trên bản đồ. Có thể chờ để quan sát hoạt động của
            đoàn đối thủ, nhưng khẩu phần vẫn tiêu hao.
          </div>
        )}
        {state.campaign?.lastOutcomeKey && (
          <div className="outcome">
            <span>KẾT QUẢ GẦN NHẤT</span>
            <p>{text(state.campaign.lastOutcomeKey)}</p>
          </div>
        )}
      </div>
    </aside>
  );
}

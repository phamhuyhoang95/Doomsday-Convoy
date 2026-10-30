import { useState } from "react";
import { fieldEntryReason } from "../../fieldwork/engine";
import type { GameState } from "../../core/state-schema";
import type { GameCommand } from "../../core/commands";
import { choiceAvailability } from "../../narrative/read-model";
import { evaluateCondition } from "../../narrative/conditions";
import { choiceTotalCosts } from "../../read-models/effects";
import { canAfford, supplyCosts } from "../../core/resources";
import { operationPreview } from "../../expedition/read-model";
import { useDefinition } from "../definition";
import { AssetArt } from "../components/AssetArt";
import { Costs } from "../components/shared";
import { chapterProgress } from "../../read-models/campaign";
import { presentationAsset } from "../art/registry";
import { Atmosphere } from "./Atmosphere";

export function SceneScreen({
  state,
  dispatch,
  openMap,
  startScenario,
  openCrew,
}: {
  state: GameState;
  dispatch: (p: GameCommand["payload"]) => void;
  openMap: () => void;
  startScenario: () => void;
  openCrew: () => void;
}) {
  const definition = useDefinition();
  const [fieldActor, setFieldActor] = useState(
    state.convoys[state.player.convoyId]!.actorIds[0]!,
  );
  const convoy = state.convoys[state.player.convoyId]!;
  const location = definition.locations.find(
    (l) => l.id === convoy.locationId,
  )!;
  const instance = state.activeEvents[0];
  const event = definition.campaign?.events.find(
    (e) => e.id === instance?.eventId,
  );
  const eventAssetId = event ? `asset.${event.id}` : undefined;
  const eventArt = Boolean(
    event &&
      (presentationAsset(eventAssetId, "event") ||
        definition.campaign?.assets.find((a) => a.id === eventAssetId)?.uri),
  );
  const chapter = chapterProgress(state, definition).find((c) => c.current);
  const text = (key: string) => definition.campaign?.texts[key] ?? key;
  const known = state.knowledge.factIds
    .map((id) => definition.campaign?.facts.find((f) => f.id === id))
    .filter(Boolean)
    .slice(-4);
  return (
    <section
      className={`scene-screen ${location.regionId === "region.hospital" ? "anomaly-scene" : ""}`}
    >
      <div className="scene-backdrop">
        <AssetArt
          id={eventArt ? eventAssetId : `asset.${location.id}`}
          kind={eventArt ? "event" : "location"}
          label={location.name}
        />
        <Atmosphere />
      </div>
      <div className="scene-shade" />
      <div className="scene-location">
        <span className="kicker">
          {chapter?.title ??
            definition.regions.find((r) => r.id === location.regionId)?.name}
        </span>
        <h1>{location.name}</h1>
        <p>
          {chapter?.question ??
            `HÀNH TRÌNH #${state.initialSeed.toString().padStart(4, "0")}`}
        </p>
      </div>
      <aside className="crew-rail" aria-label="Những người trên xe">
        {convoy.actorIds.map((id) => {
          const a = state.actors[id]!;
          return (
            <button
              key={id}
              className={a.status !== "active" ? "fallen" : ""}
              onClick={openCrew}
              aria-label={`Quản lý ${a.name}`}
            >
              <AssetArt id={`asset.${id}`} kind="portrait" label={a.name} />
              <div>
                <strong>{a.name}</strong>
                <div className="health-bar">
                  <i style={{ width: `${(a.health / a.maxHealth) * 100}%` }} />
                </div>
                <small>
                  {a.health} HP · {a.energy ?? 0} NL
                </small>
                <span>
                  {a.status === "active"
                    ? a.role
                    : a.status === "downed"
                      ? "ĐÃ GỤC"
                      : "VẮNG MẶT"}
                </span>
              </div>
            </button>
          );
        })}
      </aside>
      <aside className="rule-ledger">
        <small>SỔ TAY HÀNH TRÌNH</small>
        <h3>Những điều đã biết</h3>
        {known.length ? (
          known.map((f) => <p key={f!.id}>◇ {f!.description}</p>)
        ) : (
          <p>Chưa có manh mối. Trinh sát và lắng nghe những người trên xe.</p>
        )}
      </aside>
      <div className="scene-decision metal-panel">
        <div className="decision-heading">
          <span className="kicker">
            {event ? "QUYẾT ĐỊNH CỦA BẠN" : "KHOẢNG LẶNG TRÊN ĐƯỜNG"}
          </span>
          <span>◇</span>
        </div>
        <h2>{event ? text(event.titleKey) : "Trước khi tiếp tục"}</h2>
        <p className="scene-narrative">
          {event
            ? text(
                event.variants.find((v) => evaluateCondition(state, v.when))
                  ?.textKey ?? event.textKey,
              )
            : location.description}
        </p>
        {event && instance ? (
          <div className="scene-choices">
            {event.choices.map((choice, i) => {
              const v = choiceAvailability(state, choice, definition);
              const fighting = choice.outcomes.some((o) =>
                o.effects.some((e) => e.op === "combat"),
              );
              return (
                <button
                  key={choice.id}
                  className={fighting ? "danger-choice" : ""}
                  disabled={!v.enabled}
                  title={v.reason}
                  onClick={() =>
                    dispatch({
                      type: "choose",
                      convoyId: convoy.id,
                      instanceId: instance.instanceId,
                      choiceId: choice.id,
                    })
                  }
                >
                  <span className="choice-index">0{i + 1}</span>
                  <span>
                    <strong>{text(choice.labelKey)}</strong>
                    <small>
                      {v.enabled ? (
                        <>
                          <Costs
                            resources={choiceTotalCosts(
                              state,
                              choice,
                              definition,
                            )}
                          />{" "}
                          · 1 giờ
                        </>
                      ) : (
                        v.reason
                      )}
                    </small>
                  </span>
                  <b>↗</b>
                </button>
              );
            })}
          </div>
        ) : (
          <button className="primary" onClick={openMap}>
            CHỌN TUYẾN ĐƯỜNG TIẾP THEO ↗
          </button>
        )}
        {definition.campaign?.fieldwork?.sites
          .filter(
            (site) =>
              site.locationId === convoy.locationId &&
              !state.fieldwork?.completedSiteIds.includes(site.id),
          )
          .map((site) => {
            const reason = fieldEntryReason(
              state,
              site,
              fieldActor,
              definition,
            );
            const costs = supplyCosts(
              state,
              convoy,
              site.reserveHours,
              definition,
            );
            return (
              <section className="field-entry" key={site.id}>
                <span className="kicker">
                  XUẤT KÍCH TRỰC TIẾP / {site.name}
                </span>
                <p>{site.brief}</p>
                <label htmlFor="field-actor">
                  Người xuất kích · những người còn lại giữ xe
                </label>
                <select
                  id="field-actor"
                  value={fieldActor}
                  onChange={(e) => setFieldActor(e.target.value)}
                >
                  {convoy.actorIds.map((id) => (
                    <option
                      key={id}
                      value={id}
                      disabled={state.actors[id]!.status !== "active"}
                    >
                      {state.actors[id]!.name} · {state.actors[id]!.health} HP
                    </option>
                  ))}
                </select>
                <button
                  className="primary"
                  disabled={!!reason}
                  onClick={() =>
                    dispatch({
                      type: "field-enter",
                      convoyId: convoy.id,
                      siteId: site.id,
                      actorId: fieldActor,
                    })
                  }
                >
                  Vào phòng trực ↗
                </button>
                <small>
                  {reason ||
                    `Dự trù ${site.reserveHours} giờ và ${costs.food} lương thực / ${costs.water} nước ngay khi vào. Một lượt xuất kích; có thể rút sớm.`}
                </small>
              </section>
            );
          })}
        {definition.campaign?.operations &&
          convoy.locationId === "location.market" &&
          !state.scenario?.installedModuleId &&
          !state.world.facts["cache.secured"]?.value && (
            <button className="mission-entry" onClick={startScenario}>
              ⌖ CHỢ MẤT ĐIỆN{" "}
              <small>Nhiệm vụ hiện trường · cứu người và thu hồi module</small>
              <span>TIẾN VÀO ↗</span>
            </button>
          )}
      </div>
      <div className="scene-operations">
        {(["investigate", "wait", "repair"] as const).map((action, i) => {
          const preview = operationPreview(state, action, definition);
          const legacyWait =
            action === "wait" && !definition.campaign?.operations;
          const enabled = legacyWait
            ? state.status === "active" &&
              !state.combat &&
              canAfford(convoy.resources, preview.costs)
            : preview.enabled;
          return (
            <button
              key={action}
              disabled={!enabled}
              title={
                legacyWait
                  ? "Chờ một giờ, tiêu khẩu phần theo luật hành trình này."
                  : preview.reason
              }
              onClick={() =>
                dispatch(
                  action === "wait"
                    ? { type: "wait", convoyId: convoy.id, ticks: 1 }
                    : { type: action, convoyId: convoy.id },
                )
              }
            >
              <span>{["⌖", "☾", "⚒"][i]}</span>
              <strong>
                {legacyWait
                  ? "Chờ một giờ"
                  : ["Trinh sát", "Nghỉ hồi sức", "Sửa xe"][i]}
              </strong>
              <small>
                <Costs resources={preview.costs} /> · 1h
              </small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

import { useState } from "react";
import type { GameState } from "../../core/state-schema";
import type { GameCommand } from "../../core/commands";
import { planTravel } from "../../world/travel";
import { canAfford } from "../../core/resources";
import { useDefinition } from "../definition";
import { Costs } from "../components/shared";

const points: Record<string, [number, number]> = {
  "location.garage": [100, 285],
  "location.market": [250, 160],
  "location.overpass": [260, 395],
  "location.service": [465, 335],
  "location.hospital": [555, 180],
  "location.ward": [775, 100],
  "location.checkpoint": [805, 360],
  "location.refuge": [935, 230],
};
export function StrategicMap({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: (p: GameCommand["payload"]) => void;
}) {
  const definition = useDefinition();
  const convoy = state.convoys[state.player.convoyId]!;
  const [selected, setSelected] = useState("");
  const [failed, setFailed] = useState(false);
  const routes = definition.routes.filter(
    (r) =>
      r.from === convoy.locationId ||
      (r.bidirectional && r.to === convoy.locationId),
  );
  const location = definition.locations.find(
    (l) => l.id === convoy.locationId,
  )!;
  return (
    <div className="strategic-screen">
      <div className="strategic-map">
        <div className="map-title">
          <small>BẢN ĐỒ HÀNH TRÌNH</small>
          <h1>Bên kia màn sương.</h1>
          <p>Chọn đường. Tính cái giá. Giữ đoàn xe sống sót.</p>
        </div>
        <svg viewBox="0 0 1000 500" role="group" aria-label="Bản đồ Bắc Sơn">
          {!failed && (
            <image
              href="/art/a2/world.overview.jpg"
              width="1000"
              height="500"
              onError={() => setFailed(true)}
            />
          )}
          {definition.routes.map((r) => {
            const a = points[r.from],
              b = points[r.to];
            if (!a || !b) return null;
            return (
              <line
                key={r.id}
                className={`${routes.some((x) => x.id === r.id) ? "adjacent" : ""} ${selected === r.id ? "selected" : ""}`}
                x1={a[0]}
                y1={a[1]}
                x2={b[0]}
                y2={b[1]}
              />
            );
          })}
          {definition.locations.map((l) => {
            const xy = points[l.id];
            if (!xy) return null;
            const route = routes.find((r) => r.from === l.id || r.to === l.id);
            return (
              <g
                key={l.id}
                className={`map-point ${l.id === convoy.locationId ? "here" : ""}`}
                role={route ? "button" : "img"}
                aria-label={l.name}
                tabIndex={route ? 0 : undefined}
                onClick={() => route && setSelected(route.id)}
                onKeyDown={(e) => {
                  if (route && ["Enter", " "].includes(e.key)) {
                    e.preventDefault();
                    setSelected(route.id);
                  }
                }}
              >
                <circle
                  cx={xy[0]}
                  cy={xy[1]}
                  r={l.id === convoy.locationId ? 12 : 7}
                />
                <text x={xy[0]} y={xy[1] + 29}>
                  {l.name}
                </text>
                {l.id === convoy.locationId && (
                  <text className="map-bus" x={xy[0]} y={xy[1] - 23}>
                    ▰
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div className="intel-note">
          <span className="radar-symbol">⌖</span>
          <div>
            <small>TÍN HIỆU TRO TÀN</small>
            <p>
              {state.knowledge.factIds.includes("rival.motive")
                ? "Đã biết mục tiêu của đối thủ. Tiếp tục tìm dấu vết trên hành trình."
                : "Chưa có thông tin đủ tin cậy về vị trí đối thủ."}
            </p>
          </div>
        </div>
      </div>
      <aside className="route-drawer metal-panel">
        <small>VỊ TRÍ HIỆN TẠI</small>
        <h2>{location.name}</h2>
        <p>{location.description}</p>
        <div className="route-options">
          {routes.map((r) => {
            let reason = "",
              plan = null;
            try {
              plan = planTravel(state, convoy.id, r.id, definition);
            } catch (e) {
              reason = e instanceof Error ? e.message : "Tuyến đang khóa";
            }
            const to = definition.locations.find(
              (l) => l.id === (r.from === convoy.locationId ? r.to : r.from),
            );
            return (
              <article
                className={selected === r.id ? "selected" : ""}
                key={r.id}
              >
                <small>
                  {r.travelTicks} GIỜ ·{" "}
                  {(plan?.riskBps ?? r.risk.chanceBps) / 100}% RỦI RO
                </small>
                <h3>{to?.name}</h3>
                {plan && <Costs resources={plan.costs} />}
                <button
                  disabled={!plan || !canAfford(convoy.resources, plan.costs)}
                  title={reason}
                  onClick={() =>
                    dispatch({
                      type: "travel",
                      convoyId: convoy.id,
                      routeId: r.id,
                    })
                  }
                >
                  LÊN ĐƯỜNG ↗
                </button>
                {reason && <small>{reason}</small>}
              </article>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

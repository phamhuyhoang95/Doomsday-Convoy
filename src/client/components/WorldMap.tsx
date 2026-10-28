import { useState } from "react";
import { useDefinition } from "../definition";
import type { GameCommand } from "../../core/commands";
import { canAfford } from "../../core/resources";
import type { GameState } from "../../core/state-schema";
import { planTravel } from "../../world/travel";
import { Costs } from "./shared";

const positions: Record<string, [number, number]> = {
  "location.garage": [95, 310],
  "location.market": [265, 165],
  "location.overpass": [260, 395],
  "location.service": [430, 350],
  "location.hospital": [550, 165],
  "location.ward": [710, 95],
  "location.checkpoint": [740, 340],
  "location.refuge": [910, 225],
};

export function WorldMap({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: (payload: GameCommand["payload"]) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const definition = useDefinition();
  const convoy = state.convoys[state.player.convoyId];
  if (!convoy) return null;
  const routes = definition.routes.filter(
    (route) =>
      route.from === convoy.locationId ||
      (route.bidirectional && route.to === convoy.locationId),
  );
  return (
    <section className="panel map-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">TUYẾN ĐƯỜNG BẮC SƠN</p>
          <h2>Bên kia màn sương</h2>
        </div>
        <span className="badge">8 ĐỊA ĐIỂM</span>
      </div>
      <div className="world-map">
        <svg
          viewBox="0 0 1000 490"
          role="img"
          aria-label="Bản đồ hành trình từ thành phố đến hầm trú Bắc Sơn"
        >
          <defs>
            <pattern
              id="grid"
              width="36"
              height="36"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 36 0 L 0 0 0 36"
                fill="none"
                stroke="#afc1ac"
                strokeWidth=".4"
                opacity=".1"
              />
            </pattern>
            <radialGradient id="fog">
              <stop offset="0" stopColor="#3f6653" stopOpacity=".28" />
              <stop offset="1" stopColor="#182523" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1000" height="490" fill="url(#grid)" />
          <ellipse cx="560" cy="230" rx="440" ry="220" fill="url(#fog)" />
          <path className="river" d="M420 -20 Q320 100 430 200 T460 500" />
          <path
            className="contour"
            d="M20 95 Q220 20 290 70 T600 30 M580 450 Q700 390 1020 465 M760 10 Q830 70 1000 25"
          />
          <text className="map-region" x="90" y="65">
            THÀNH PHỐ TẮT ĐÈN
          </text>
          <text className="map-region" x="560" y="40">
            THÁNH AN
          </text>
          <text className="map-region" x="770" y="465">
            VÀNH ĐAI PHÍA BẮC
          </text>
          {definition.routes.map((route) => {
            const from = positions[route.from];
            const to = positions[route.to];
            if (!from || !to) return null;
            const traversed =
              (state.world.routes[route.id]?.traversals ?? 0) > 0;
            const adjacent = routes.some((entry) => entry.id === route.id);
            return (
              <g
                key={route.id}
                className={`map-route ${traversed ? "traversed" : ""} ${selected === route.id ? "selected" : ""}`}
              >
                <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} />
                {adjacent && (
                  <text
                    x={(from[0] + to[0]) / 2}
                    y={(from[1] + to[1]) / 2 - 10}
                  >
                    {route.travelTicks}h
                  </text>
                )}
              </g>
            );
          })}
          {definition.locations.map((location) => {
            const position = positions[location.id];
            if (!position) return null;
            const here = location.id === convoy.locationId;
            const seen = state.knowledge.locationIds.includes(location.id);
            const route = routes.find(
              (entry) =>
                entry.to === location.id ||
                (entry.bidirectional && entry.from === location.id),
            );
            return (
              <g
                key={location.id}
                className={`map-node ${here ? "current" : ""} ${seen ? "seen" : ""} ${!state.world.locations[location.id]?.accessible ? "closed" : ""}`}
                role={route ? "button" : "img"}
                tabIndex={route ? 0 : undefined}
                aria-label={location.name}
                onClick={() => route && setSelected(route.id)}
                onKeyDown={(event) => {
                  if ((event.key === "Enter" || event.key === " ") && route) {
                    event.preventDefault();
                    setSelected(route.id);
                  }
                }}
              >
                {here && (
                  <circle
                    cx={position[0]}
                    cy={position[1]}
                    r="24"
                    className="pulse"
                  />
                )}
                <circle cx={position[0]} cy={position[1]} r={here ? 10 : 7} />
                <text x={position[0]} y={position[1] + 30}>
                  {location.name}
                </text>
                {here && (
                  <text
                    className="you-are-here"
                    x={position[0]}
                    y={position[1] - 32}
                  >
                    ĐOÀN XE
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div className="map-legend">
          <span>● Vị trí đoàn</span>
          <span>— Đã đi qua</span>
          <span>┄ Tuyến chưa khám phá</span>
        </div>
      </div>
      <div className="route-list">
        <h3>Chọn tuyến tiếp theo</h3>
        {routes.map((route) => {
          const destinationId =
            route.from === convoy.locationId ? route.to : route.from;
          const destination = definition.locations.find(
            (entry) => entry.id === destinationId,
          );
          let plan = null;
          let reason = "";
          try {
            plan = planTravel(state, convoy.id, route.id, definition);
          } catch (error) {
            reason = error instanceof Error ? error.message : "Tuyến đang khóa";
          }
          const affordable = plan && canAfford(convoy.resources, plan.costs);
          return (
            <div
              className={`route-card ${selected === route.id ? "selected" : ""}`}
              key={route.id}
            >
              <div>
                <strong>{destination?.name}</strong>
                <p>
                  {route.travelTicks} giờ · Rủi ro{" "}
                  {(plan?.riskBps ?? route.risk.chanceBps) / 100}%{" "}
                  {plan && plan.riskBps < route.risk.chanceBps && (
                    <span className="intel-badge">
                      Intel: từ {route.risk.chanceBps / 100}%
                    </span>
                  )}
                  {plan && <Costs resources={plan.costs} />}
                </p>
                {reason && (
                  <small className="muted">
                    Cần giải quyết mục tiêu hoặc địa điểm đang bị phong tỏa.
                  </small>
                )}
              </div>
              <button
                className="button route-go"
                disabled={
                  !affordable ||
                  Boolean(state.combat) ||
                  state.status !== "active"
                }
                onClick={() =>
                  dispatch({
                    type: "travel",
                    convoyId: convoy.id,
                    routeId: route.id,
                  })
                }
                aria-label={`Di chuyển tới ${destination?.name}`}
              >
                Lên đường ↗
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

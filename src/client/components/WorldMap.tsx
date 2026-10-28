import { useState } from "react";
import { useDefinition } from "../definition";
import type { GameCommand } from "../../core/commands";
import { canAfford } from "../../core/resources";
import type { GameState } from "../../core/state-schema";
import { planTravel } from "../../world/travel";
import { Costs } from "./shared";
import { presentationAsset } from "../art/registry";

const positions: Record<string, [number, number]> = {
  "location.garage": [100, 285],
  "location.market": [250, 160],
  "location.overpass": [260, 395],
  "location.service": [465, 335],
  "location.hospital": [555, 180],
  "location.ward": [775, 100],
  "location.checkpoint": [805, 360],
  "location.refuge": [935, 230],
};

export function WorldMap({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: (payload: GameCommand["payload"]) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const [vehicleFailed, setVehicleFailed] = useState(false);
  const background = presentationAsset("asset.world.overview", "location");
  const bus = presentationAsset("asset.vehicle.bus", "vehicle");
  const hasArt = !!background && !mapFailed;
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
      <div
        className={`world-map ${hasArt ? "painted-map" : ""}`}
        role="region"
        aria-label="Bản đồ tương tác; có thể kéo ngang trên màn hình nhỏ"
        tabIndex={0}
      >
        <svg
          viewBox="0 0 1000 500"
          role="group"
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
            <linearGradient id="headlight-beam" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#fff3b0" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#ffd875" stopOpacity="0" />
            </linearGradient>
          </defs>
          {hasArt && (
            <image
              href={background.uri}
              width="1000"
              height="500"
              preserveAspectRatio="xMidYMid meet"
              onError={() => setMapFailed(true)}
            />
          )}
          {!hasArt && (
            <g>
              <rect width="1000" height="500" fill="url(#grid)" />
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
            </g>
          )}
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
                <circle cx={position[0]} cy={position[1]} r={here ? 10 : 7} />
                <text x={position[0]} y={position[1] + 30}>
                  {location.name}
                </text>
              </g>
            );
          })}
          {/* Animated convoy vehicle with smooth translation between locations */}
          {(() => {
            const currentPos = positions[convoy.locationId] ?? [100, 285];
            return (
              <g
                className="animated-convoy-vehicle"
                style={{
                  transform: `translate(${currentPos[0]}px, ${currentPos[1]}px)`,
                  transition: "transform 0.9s cubic-bezier(0.25, 1, 0.5, 1)",
                  pointerEvents: "none",
                }}
              >
                {/* Vệt sáng đèn pha */}
                <polygon
                  points="12,-32 85,-55 85,-10"
                  fill="url(#headlight-beam)"
                  opacity="0.5"
                />
                <circle cx={0} cy={0} r={24} className="pulse" />
                {bus && !vehicleFailed && (
                  <image
                    className="convoy-map-sprite"
                    href={bus.uri}
                    x={-23}
                    y={-48}
                    width={46}
                    height={32}
                    onError={() => setVehicleFailed(true)}
                  />
                )}
                <text
                  className="you-are-here"
                  x={0}
                  y={-54}
                  textAnchor="middle"
                >
                  ĐOÀN XE
                </text>
              </g>
            );
          })()}
        </svg>
        <div className="map-legend">
          <span>● Vị trí đoàn</span>
          <span>— Đã đi qua</span>
          <span>┄ Tuyến chưa khám phá</span>
        </div>
        {(() => {
          const rivalId = definition.campaign?.rival?.id ?? "";
          const rivalConvoy = state.convoys[rivalId];
          const rivalNpc = state.world.npcs[rivalId];
          const rivalLoc = definition.locations.find(
            (l) => l.id === rivalConvoy?.locationId,
          );
          if (!rivalConvoy || !rivalNpc || rivalNpc.intent === "defeated")
            return null;
          const ticksToNext = Math.max(
            0,
            rivalNpc.nextActionTick - state.world.tick,
          );
          return (
            <div
              className="rival-telemetry-banner"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 14px",
                background: "rgba(180, 50, 40, 0.15)",
                border: "1px solid rgba(220, 80, 70, 0.4)",
                borderRadius: "3px",
                margin: "10px 0",
                fontSize: "0.75rem",
                color: "#ffc2b8",
              }}
            >
              <span>
                <strong style={{ color: "#ff8274" }}>⚠ ĐOÀN XE TRO TÀN:</strong>{" "}
                Đang tại <em>{rivalLoc?.name ?? "Khu vực bí mật"}</em> (
                {rivalNpc.intent === "search"
                  ? "Đang săn tìm Mắt Gương"
                  : "Đang di chuyển chặn đầu"}
                )
              </span>
              <span
                className="badge danger"
                style={{ fontSize: "0.65rem", padding: "2px 6px" }}
              >
                HÀNH ĐỘNG SAU: {ticksToNext}H
              </span>
            </div>
          );
        })()}
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

import { useEffect, useRef, useState } from "react";
import type { GameCommand } from "../../core/commands";
import type { GameState } from "../../core/state-schema";
import type { Direction, FieldSite, Expedition } from "../../fieldwork/schema";
import {
  cellKey,
  distance,
  visibleCells,
  ambientLight,
  passable,
  vectors,
} from "../../fieldwork/geometry";
import { useDefinition } from "../definition";
import "./exploration.css";
const size = 48;
const angles: Record<Direction, number> = {
  north: 0,
  east: 90,
  south: 180,
  west: 270,
};
const keys: Record<string, Direction> = {
  w: "north",
  a: "west",
  s: "south",
  d: "east",
  ArrowUp: "north",
  ArrowLeft: "west",
  ArrowDown: "south",
  ArrowRight: "east",
};
function Stage({
  site,
  e,
  step,
  interact,
}: {
  site: FieldSite;
  e: Expedition;
  step: (d: Direction) => void;
  interact: (id: string) => void;
}) {
  const [small, setSmall] = useState(() => window.innerWidth < 760);
  useEffect(() => {
    const resize = () => setSmall(window.innerWidth < 760);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  const visible = new Set(visibleCells(site, e).map(cellKey)),
    seen = new Set(e.seen);
  const width = site.grid[0]!.length * size,
    height = site.grid.length * size;
  const cameraX = small
    ? Math.max(0, Math.min(width - size * 9, (e.position.x - 4) * size))
    : 0;
  const cameraY = small
    ? Math.max(0, Math.min(height - size * 7, (e.position.y - 3) * size))
    : 0;
  const target = (p: { x: number; y: number }) => {
    const dx = p.x - e.position.x,
      dy = p.y - e.position.y;
    if (Math.abs(dx) + Math.abs(dy) === 1)
      step(dx > 0 ? "east" : dx < 0 ? "west" : dy > 0 ? "south" : "north");
  };
  return (
    <svg
      className="field-stage"
      viewBox={`${cameraX} ${cameraY} ${small ? size * 9 : width} ${small ? size * 7 : height}`}
      role="img"
      aria-label="Mặt bằng phòng trực. Dùng các nút hướng hoặc WASD để di chuyển."
    >
      <defs>
        <pattern
          id="floor-tiles"
          width="48"
          height="48"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 0H48V48H0Z"
            fill="#283334"
            stroke="#46504a"
            strokeWidth=".7"
          />
          <path
            d="M4 7L18 9M28 39L44 38M34 0V10"
            stroke="#76806b"
            opacity=".12"
          />
        </pattern>
        <radialGradient id="pool-light">
          <stop stopColor="#ffe1a0" stopOpacity=".38" />
          <stop offset="1" stopColor="#d9bd6f" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="torch-light">
          <stop stopColor="#f4e8bb" stopOpacity=".3" />
          <stop offset="1" stopColor="#f1dda2" stopOpacity="0" />
        </radialGradient>
        <clipPath id="known-floor">
          {site.grid.flatMap((row, y) =>
            [...row].map((tile, x) =>
              tile === "." && seen.has(cellKey({ x, y })) ? (
                <rect
                  key={`${x},${y}`}
                  x={x * size}
                  y={y * size}
                  width={size}
                  height={size}
                />
              ) : null,
            ),
          )}
        </clipPath>
        <clipPath id="visible-floor">
          {site.grid.flatMap((row, y) =>
            [...row].map((tile, x) =>
              tile === "." && visible.has(cellKey({ x, y })) ? (
                <rect
                  key={`${x},${y}`}
                  x={x * size}
                  y={y * size}
                  width={size}
                  height={size}
                />
              ) : null,
            ),
          )}
        </clipPath>
        <filter id="shadow-blur">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <pattern
          id="floor-stains"
          width="97"
          height="83"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M5 28q33-29 47 3t28 20"
            fill="none"
            stroke="#132020"
            strokeWidth="9"
            opacity=".22"
          />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="#060b0e" />
      {site.grid.map((row, y) =>
        [...row].map((tile, x) => {
          const key = cellKey({ x, y }),
            lit = visible.has(key),
            known = seen.has(key);
          if (!known && !lit) return null;
          return (
            <g
              key={key}
              opacity={lit ? 1 : 0.24}
              onClick={() => target({ x, y })}
            >
              <rect
                x={x * size}
                y={y * size}
                width={size}
                height={size}
                fill={tile === "#" ? "#10191e" : "url(#floor-tiles)"}
                stroke={tile === "#" ? "#5b6053" : "none"}
                strokeWidth={tile === "#" ? 2 : 0}
              />
              {tile === "#" && (
                <path
                  d={`M${x * size + 3} ${y * size + 5}h42v37`}
                  fill="none"
                  stroke="#263334"
                  strokeWidth="3"
                />
              )}
            </g>
          );
        }),
      )}
      <rect
        x="48"
        y="48"
        width={width - 96}
        height={height - 96}
        fill="url(#floor-stains)"
        clipPath="url(#known-floor)"
        pointerEvents="none"
      />
      {site.rooms.map((r, i) => {
        const known = seen.has(cellKey({ x: r.x + 2, y: r.y + 2 }));
        return (
          known && (
            <g
              clipPath="url(#known-floor)"
              key={r.name}
              opacity=".5"
              pointerEvents="none"
            >
              <text
                x={(r.x + 0.5) * size}
                y={(r.y + 0.7) * size}
                fill="#b5b29a"
                fontSize="11"
                letterSpacing="2"
              >
                {r.name.toUpperCase()}
              </text>
              {[0, 1].map((n) => (
                <g
                  key={n}
                  transform={`translate(${(r.x + 0.5 + n * 2.4) * size},${(r.y + 1.2) * size})`}
                >
                  <rect
                    width="59"
                    height="95"
                    rx="3"
                    fill={i === 2 ? "#312f24" : "#16272d"}
                    stroke="#637168"
                    strokeWidth="2"
                  />
                  <rect
                    x="6"
                    y="7"
                    width="47"
                    height="21"
                    fill="#9a9c84"
                    opacity=".6"
                  />
                  <path
                    d="M4 35h51M4 42h51M4 73h51"
                    stroke="#6c7d72"
                    opacity=".5"
                  />
                  {i === 2 && (
                    <path d="M7 3v87M15 3v87" stroke="#b9985d" opacity=".35" />
                  )}
                </g>
              ))}
            </g>
          )
        );
      })}
      <g clipPath="url(#visible-floor)">
        {site.lights.map((p, i) => (
          <g
            key={i}
            opacity={seen.has(cellKey(p)) ? 1 : 0}
            pointerEvents="none"
          >
            <circle
              cx={(p.x + 0.5) * size}
              cy={(p.y + 0.5) * size}
              r="130"
              fill="url(#pool-light)"
            />
            <circle
              cx={(p.x + 0.5) * size}
              cy={(p.y + 0.5) * size}
              r="6"
              fill="#ecd49b"
            />
            <path
              d={`M${p.x * size + 12} ${p.y * size + 8}h24`}
              stroke="#e9cf91"
              strokeWidth="3"
            />
          </g>
        ))}
      </g>
      {site.objects
        .filter((o) => seen.has(cellKey(o.position)))
        .map((o) => {
          const x = o.position.x * size,
            y = o.position.y * size,
            lit = visible.has(cellKey(o.position)),
            near = distance(o.position, e.position) <= 1,
            collected = e.collected.includes(o.id);
          return (
            <g
              key={o.id}
              className={`field-prop ${near ? "near" : ""}`}
              opacity={lit ? 1 : 0.22}
              onClick={() => near && interact(o.id)}
              aria-hidden="true"
            >
              {o.kind === "door" ? (
                <g>
                  <rect
                    x={x + 4}
                    y={y + 2}
                    width="40"
                    height="44"
                    fill={e.openDoors.includes(o.id) ? "#32433c" : "#73513b"}
                    stroke="#b59e6a"
                    strokeWidth="2"
                    transform={
                      e.openDoors.includes(o.id)
                        ? `rotate(-75 ${x + 4} ${y + 2})`
                        : undefined
                    }
                  />
                  <circle cx={x + 35} cy={y + 27} r="3" fill="#d2b471" />
                </g>
              ) : o.kind === "exit" ? (
                <g>
                  <rect
                    x={x + 5}
                    y={y + 5}
                    width="38"
                    height="38"
                    fill="#243f39"
                    stroke="#a6c8a6"
                  />
                  <path
                    d={`M${x + 33} ${y + 24}h-20m7-8-8 8 8 8`}
                    stroke="#c3d8ac"
                    strokeWidth="2"
                    fill="none"
                  />
                </g>
              ) : (
                <g>
                  <rect
                    x={x + 5}
                    y={y + 10}
                    width="37"
                    height="27"
                    rx="2"
                    fill={collected ? "#242c29" : "#4a4633"}
                    stroke={collected ? "#626652" : "#d8b770"}
                  />
                  <text
                    x={x + 24}
                    y={y + 30}
                    textAnchor="middle"
                    fill="#e0d6b1"
                    fontSize="18"
                  >
                    {collected ? "·" : o.kind === "record" ? "≡" : "+"}
                  </text>
                </g>
              )}
              {near && !collected && (
                <circle
                  cx={x + 24}
                  cy={y + 24}
                  r="22"
                  fill="none"
                  stroke="#d2ba76"
                  strokeDasharray="3 5"
                />
              )}
            </g>
          );
        })}
      {e.torch && e.battery > 0 && (
        <g clipPath="url(#visible-floor)">
          <g
            className="field-avatar"
            style={{
              transform: `translate(${(e.position.x + 0.5) * size}px,${(e.position.y + 0.5) * size}px)`,
            }}
            pointerEvents="none"
          >
            <g transform={`rotate(${angles[e.facing]})`}>
              <path d="M0 0L-110-250Q0-290 110-250Z" fill="url(#torch-light)" />
            </g>
          </g>
        </g>
      )}
      {visible.has(cellKey(e.shadow)) && (
        <g
          className="field-shadow"
          style={{
            transform: `translate(${(e.shadow.x + 0.5) * size}px,${(e.shadow.y + 0.5) * size}px)`,
          }}
          pointerEvents="none"
        >
          <ellipse
            cy="6"
            rx="21"
            ry="31"
            fill="#000"
            filter="url(#shadow-blur)"
          />
          <path
            d="M-11 17-7-11Q0-30 7-11l9 28-10-3-8 5Z"
            fill="#020304"
            stroke="#56666a"
            strokeWidth="1"
          />
          <path d="M-6-9h3m5 0h3" stroke="#c5b68e" strokeWidth="2" />
        </g>
      )}
      <g
        className="field-avatar"
        style={{
          transform: `translate(${(e.position.x + 0.5) * size}px,${(e.position.y + 0.5) * size}px)`,
        }}
        pointerEvents="none"
      >
        <ellipse cy="13" rx="14" ry="7" fill="#000" opacity=".7" />
        <g transform={`rotate(${angles[e.facing]})`}>
          <rect
            x="-11"
            y="-1"
            width="22"
            height="22"
            rx="7"
            fill="#746a4a"
            stroke="#b4a478"
            strokeWidth="1.5"
          />
          <rect x="7" y="-8" width="7" height="17" rx="2" fill="#a7ac8d" />
          <circle cy="-4" r="8" fill="#c4b08b" />
          <path d="M-6-10q6-6 12 0" stroke="#252a24" strokeWidth="5" />
          {e.torch && e.battery > 0 && (
            <circle cx="11" cy="-10" r="3" fill="#fff6b9" />
          )}
        </g>
        <circle
          r="21"
          fill="none"
          stroke="#c8b36b"
          opacity=".7"
          strokeDasharray="3 5"
        />
      </g>
      {e.cue === "hit" && (
        <rect
          width={width}
          height={height}
          fill="#a63828"
          opacity=".13"
          pointerEvents="none"
        />
      )}
    </svg>
  );
}
export function ExplorationScreen({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: (p: GameCommand["payload"]) => boolean;
}) {
  const def = useDefinition(),
    e = state.fieldwork!.expedition!,
    site = def.campaign!.fieldwork!.sites.find((s) => s.id === e.siteId)!,
    actor = state.actors[e.actorId]!;
  const [run, setRun] = useState(false),
    [paused, setPaused] = useState(false),
    [confirmRescue, setConfirmRescue] = useState(false);
  const latest = useRef({ state, paused, run, confirmRescue });
  latest.current = {
    state,
    paused: paused || confirmRescue,
    run,
    confirmRescue,
  };
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;
  const move = (d: Direction) => {
    if (latest.current.paused) return;
    dispatchRef.current({
      type: "field-step",
      convoyId: latest.current.state.player.convoyId,
      action: "move",
      direction: d,
      run: latest.current.run,
    });
  };
  const act = (objectId: string) => {
    if (!latest.current.paused)
      dispatch({
        type: "field-interact",
        convoyId: state.player.convoyId,
        objectId,
      });
  };
  const visible = new Set(visibleCells(site, e).map(cellKey));
  const nearby = site.objects.filter(
    (o) =>
      distance(e.position, o.position) <= 1 &&
      visible.has(cellKey(o.position)) &&
      (!e.collected.includes(o.id) || o.kind === "door" || o.kind === "exit"),
  );
  const interactRef = useRef(() => {});
  interactRef.current = () => {
    const l = latest.current,
      ex = l.state.fieldwork?.expedition;
    if (!ex || l.paused) return;
    const ss = def.campaign!.fieldwork!.sites.find((s) => s.id === ex.siteId)!;
    const near = ss.objects.filter(
      (o) =>
        distance(ex.position, o.position) <= 1 && !ex.collected.includes(o.id),
    );
    const object = near.find((o) => o.kind !== "exit") ?? near[0];
    if (object)
      dispatchRef.current({
        type: "field-interact",
        convoyId: l.state.player.convoyId,
        objectId: object.id,
      });
  };
  useEffect(() => {
    let lastStep = -Infinity;
    const down = (event: KeyboardEvent) => {
      if (
        (event.target as HTMLElement).closest("input,select,textarea") ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return;
      const dir = keys[event.key] ?? keys[event.key.toLowerCase()];
      if (dir) {
        event.preventDefault();
        if (event.timeStamp - lastStep < 180) return;
        lastStep = event.timeStamp;
        move(dir);
        return;
      }
      if (event.repeat) return;
      if (event.key === "Escape") {
        if (latest.current.confirmRescue) setConfirmRescue(false);
        else setPaused((p) => !p);
      } else if (event.key.toLowerCase() === "e") interactRef.current();
      else if (event.key.toLowerCase() === "f" && !latest.current.paused)
        dispatchRef.current({
          type: "field-step",
          convoyId: latest.current.state.player.convoyId,
          action: "torch",
        });
      else if (event.key === "Shift") setRun(true);
    };
    const up = (event: KeyboardEvent) => {
      if (event.key === "Shift") setRun(false);
    };
    const blur = () => {
      setRun(false);
      setPaused(true);
    };
    const hidden = () => {
      if (document.hidden) blur();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);
  const base = { convoyId: state.player.convoyId };
  return (
    <main className="field-workspace">
      <header className="field-title">
        <div>
          <span className="kicker">THÁNH AN / XUẤT KÍCH 01</span>
          <h1>{site.name}</h1>
          <p>Đi theo dấu đèn. WASD di chuyển · E tương tác · F đèn pin.</p>
        </div>
        <button onClick={() => setPaused((p) => !p)}>
          {paused ? "Tiếp tục ▷" : "Tạm dừng Ⅱ"}
        </button>
      </header>
      <div className="field-layout" inert={confirmRescue}>
        <div className="field-scene-column">
          <section
            className="field-viewport"
            tabIndex={0}
            aria-label="Khu khám phá; WASD hoặc phím mũi tên để di chuyển"
          >
            <Stage site={site} e={e} step={move} interact={act} />
            <div className="field-film-label">
              {site.rooms.find(
                (r) =>
                  e.position.x >= r.x &&
                  e.position.x < r.x + r.width &&
                  e.position.y >= r.y &&
                  e.position.y < r.y + r.height,
              )?.name ?? "Ngưỡng cửa"}
              <span>
                {ambientLight(site, e, e.position)
                  ? "ĐÈN CỐ ĐỊNH"
                  : "NGOÀI VÙNG ĐÈN"}
              </span>
            </div>
            {paused && (
              <div className="field-pause">
                <h2>Giữ nguyên nhịp thở.</h2>
                <p>Vị trí, pin và cái bóng đều đang dừng.</p>
                <button className="primary" onClick={() => setPaused(false)}>
                  Tiếp tục khám phá ▷
                </button>
              </div>
            )}
          </section>
          <div className="field-mobile-interact">
            {nearby
              .filter((o) => o.kind !== "exit")
              .map((o) => (
                <button
                  key={o.id}
                  disabled={paused || confirmRescue}
                  onClick={() => act(o.id)}
                >
                  {o.kind === "door"
                    ? e.openDoors.includes(o.id)
                      ? "Đóng "
                      : "Mở "
                    : "Lục soát / "}
                  {o.name}
                </button>
              ))}
          </div>
          <div className="field-manual-controls">
            {" "}
            <div className="field-actions">
              <button
                disabled={paused}
                onClick={() =>
                  dispatch({ type: "field-step", ...base, action: "torch" })
                }
              >
                F · {e.torch && e.battery ? "Tắt đèn" : "Bật đèn"}
              </button>
              <button
                aria-pressed={run}
                onClick={() => setRun((p) => !p)}
                disabled={paused}
              >
                {run ? "ĐANG CHẠY" : "Đi bộ / chạy"}
              </button>
            </div>
            <div className="field-dpad" aria-label="Điều khiển hướng">
              {(["north", "west", "south", "east"] as const).map((d, i) => {
                const v = vectors[d];
                return (
                  <button
                    key={d}
                    className={`dir-${d}`}
                    disabled={
                      paused ||
                      !passable(site, e, {
                        x: e.position.x + v.x,
                        y: e.position.y + v.y,
                      })
                    }
                    onClick={() => move(d)}
                    aria-label={`Đi ${["lên", "trái", "xuống", "phải"][i]}`}
                  >
                    {["↑", "←", "↓", "→"][i]}
                  </button>
                );
              })}
            </div>
            <small className="field-controls-help">
              WASD / phím mũi tên · Shift chạy · E tương tác · F đèn · Esc dừng
              · Chạy hao 2 pin/bước
            </small>
          </div>
        </div>
        <aside className="field-console">
          <div className="field-person">
            <span className="kicker">NGƯỜI XUẤT KÍCH</span>
            <strong>
              {actor.name}
              <small>
                {actor.health}/{actor.maxHealth} HP
              </small>
            </strong>
            <div className="field-stat">
              <span>PIN ĐÈN</span>
              <b>
                {e.battery}/{site.battery}
              </b>
            </div>
            <meter min="0" max={site.battery} value={e.battery} />
            <div className="field-stat">
              <span>NHỊP XUẤT KÍCH</span>
              <b>
                {e.beat}/{site.maxBeats}
              </b>
            </div>
            <div className="field-stat">
              <span>TIẾNG ĐỘNG VỪA PHÁT</span>
              <b>{["—", "●", "●●", "●●●"][Math.min(3, e.noise)]}</b>
            </div>
            <small className="field-clock-note">
              Ca {site.reserveHours} giờ đã dự trù. Đứng yên dừng thời gian
              nhiệm vụ.
            </small>
          </div>
          <section className="field-bag">
            <span className="kicker">
              TÚI MANG VỀ · {e.cargo.length}/{site.capacity}
            </span>
            {Array.from({ length: site.capacity }, (_, i) => (
              <div key={i}>
                {site.objects.find((o) => o.id === e.cargo[i])?.name ??
                  "Một chỗ trống"}
              </div>
            ))}
          </section>
          <div className={`field-cue cue-${e.cue}`} role="status">
            {e.cue === "knock"
              ? "Có tiếng gõ ở phía bên kia cánh cửa…"
              : e.cue === "advance"
                ? "Tiếng kéo lê đang tới gần…"
                : e.cue === "light"
                  ? "Tiếng động vang lên. Bóng vẫn đứng yên."
                  : e.cue === "hit"
                    ? "Vai lạnh buốt. Bạn bị đẩy về vệt đèn cửa ra."
                    : "Lắng nghe khoảng tối giữa hai nhịp bước."}
          </div>
          <section
            className="field-interactions"
            aria-label="Vật trong tầm với"
          >
            {nearby.length ? (
              nearby.map((o) => (
                <button key={o.id} disabled={paused} onClick={() => act(o.id)}>
                  <span>E /</span>{" "}
                  {o.kind === "door"
                    ? e.openDoors.includes(o.id)
                      ? "Đóng "
                      : "Mở "
                    : o.kind === "exit"
                      ? "Về xe / "
                      : "Lục soát / "}
                  {o.name}
                </button>
              ))
            ) : (
              <p>Đứng cạnh cửa hoặc vật thể để tương tác.</p>
            )}
          </section>
          <button
            className="field-rescue"
            onClick={() => setConfirmRescue(true)}
          >
            Gọi kéo về xe ↗
          </button>
        </aside>
      </div>
      <footer className="field-notebook">
        <div>
          <span className="kicker">DẤU VẾT VỪA NHẬN</span>
          <p>{e.log.at(-1)}</p>
        </div>
        <div>
          <span className="kicker">SỔ TAY</span>
          <p>
            {state.knowledge.factIds.includes(site.ruleFactId)
              ? "Tiếng động trong tối kéo bóng lại gần. Ánh sáng giữ nó đứng yên."
              : "Chưa đủ bằng chứng. Quan sát thứ xảy ra khi bạn đổi cách di chuyển và dùng đèn."}
          </p>
        </div>
      </footer>
      {confirmRescue && (
        <div
          className="field-confirm"
          role="dialog"
          aria-modal="true"
          aria-label="Xác nhận cứu hộ"
        >
          <div className="metal-panel">
            <h2>Đội giữ xe sẽ kéo bạn ra.</h2>
            <p>
              Bỏ toàn bộ đồ trong túi. {actor.name} mất {site.rescueDamage} HP;
              xe mất {site.rescueVehicleCost} độ bền. Không thu thêm giờ.
            </p>
            <button
              className="primary"
              onClick={() =>
                dispatch({ type: "field-exit", ...base, rescue: true })
              }
            >
              Rút ngay ↗
            </button>
            <button autoFocus onClick={() => setConfirmRescue(false)}>
              Ở lại
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

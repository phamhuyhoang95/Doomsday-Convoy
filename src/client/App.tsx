import { useState } from "react";
import { DefinitionContext, useDefinition } from "./definition";
import { RESOURCE_IDS } from "../core/primitives";
import type { GameState } from "../core/state-schema";
import { CombatPanel } from "./components/CombatPanel";
import { Inventory } from "./components/Convoy";
import { EventPanel } from "./components/EventPanel";
import { DebugPanel, Journal } from "./components/Journal";
import { Meter, resourceLabels, resourceSymbols } from "./components/shared";
import { WorldMap } from "./components/WorldMap";
import { useGame } from "./use-game";
import { AudioControl } from "./components/AudioControl";
import { CrewConsole } from "./components/CrewConsole";
import { ActionDeck } from "./components/ActionDeck";
import { ActionReportPanel } from "./components/ActionReport";
import { operationPreview } from "../expedition/read-model";
import { AssetArt } from "./components/AssetArt";
import { ScenarioScene } from "./components/ScenarioScene";

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        LC<span>↗</span>
      </span>
      <span>
        LAST CONVOY<small>CHUYẾN XE CUỐI CÙNG</small>
      </span>
    </div>
  );
}
function MainMenu({
  start,
  load,
  audio,
}: {
  start: (seed: number) => void;
  load: (slot?: string) => void;
  audio: ReturnType<typeof useGame>["audio"];
}) {
  const [seed, setSeed] = useState("42");
  const [error, setError] = useState("");
  return (
    <div className="menu-shell">
      <header>
        <Brand />
        <AudioControl audio={audio} />
        <span className="badge">R1 · CHIẾN ĐẤU & SINH TỒN</span>
      </header>
      <main className="menu-main">
        <div className="menu-copy">
          <p className="eyebrow">CHIẾN THUẬT · SINH TỒN · QUỶ DỊ</p>
          <h1>
            Phía trước
            <br />
            vẫn còn <em>đường.</em>
          </h1>
          <p className="menu-description">
            Thành phố đã tắt đèn. Tiếng gọi vẫn vọng ra từ bệnh viện. Bạn còn
            một đoàn xe, ba người sống sót và một cơ hội tới Bắc Sơn.
          </p>
          <p className="r1-menu-note">
            Mới: đột kích kho chợ bằng combat theo lượt, huấn luyện và thế đánh,
            trinh sát có cache/intel, nghỉ hồi sức, sửa xe, âm thanh và bảng hậu
            quả ngay sau mỗi hành động.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const value = Number(seed);
              if (
                !/^\d+$/.test(seed) ||
                !Number.isInteger(value) ||
                value < 0 ||
                value > 0xffff_ffff
              ) {
                setError("Seed cần là số nguyên từ 0 đến 4294967295.");
                return;
              }
              setError("");
              start(value);
            }}
          >
            <label className="seed-label" htmlFor="seed">
              MÃ HÀNH TRÌNH{" "}
              <span>Cùng seed, cùng hành động, cùng kết quả.</span>
            </label>
            <div className="seed-row">
              <input
                id="seed"
                inputMode="numeric"
                value={seed}
                onChange={(event) => setSeed(event.target.value)}
                aria-describedby={error ? "seed-error" : undefined}
              />
              <button className="button primary" type="submit">
                Bắt đầu hành trình <span>↗</span>
              </button>
            </div>
            {error && (
              <p id="seed-error" className="error" role="alert">
                {error}
              </p>
            )}
          </form>
          <div className="menu-secondary">
            <button className="text-button" onClick={() => load("autosave")}>
              ↳ Tiếp tục autosave
            </button>
            <button className="text-button" onClick={() => load("manual")}>
              Tải bản lưu thủ công
            </button>
            <button className="text-button" onClick={() => load("legacy")}>
              Tải hành trình v0.1 cũ
            </button>
          </div>
          <div className="menu-guidance">
            <span>01 · RỜI THÀNH PHỐ</span>
            <span>02 · BỆNH VIỆN</span>
            <span>03 · CUỘC TRANH ĐOẠT</span>
          </div>
        </div>
        <div
          className="menu-illustration"
          aria-label="Một đoàn xe giữa thành phố bỏ hoang"
          role="img"
        >
          <AssetArt
            id="asset.location.garage"
            kind="location"
            label="Đoàn xe rời gara cuối phố"
            className="menu-key-art"
          />
          <p>
            VĨ ĐỘ 21° N<br />
            TÍN HIỆU CUỐI: BẮC SƠN
          </p>
        </div>
      </main>
      <footer>GIỮ NGƯỜI SỐNG. GIỮ XE CHẠY. GIỮ IM LẶNG KHI CHUÔNG REO.</footer>
    </div>
  );
}

function Ending({ state }: { state: GameState }) {
  const definition = useDefinition();
  const convoy = state.convoys[state.player.convoyId];
  const ending = definition.campaign?.endings.find(
    (entry) => entry.id === state.ending?.id,
  );
  const texts = definition.campaign?.texts ?? {};
  const survivors =
    convoy?.actorIds.filter((id) => state.actors[id]?.status !== "dead")
      .length ?? 0;
  return (
    <section
      className={`panel ending-panel ${state.status === "lost" ? "defeat" : ""}`}
    >
      <p className="eyebrow">HÀNH TRÌNH ĐÃ KẾT THÚC</p>
      <h1>
        {ending
          ? texts[ending.titleKey]
          : state.status === "won"
            ? "Bình minh ở Bắc Sơn."
            : "Một khoảng lặng cuối cùng."}
      </h1>
      <p>
        {ending
          ? texts[ending.textKey]
          : state.ending?.kind === "defeat"
            ? {
                "vehicle-destroyed":
                  "Chiếc xe đã không thể đi thêm. Đoàn mất cơ hội tới nơi trú.",
                "supplies-exhausted":
                  "Khẩu phần cạn trước khi đoàn tới nơi an toàn.",
                "no-active-crew": "Không còn ai đủ sức dẫn đoàn đi tiếp.",
              }[state.ending.reason]
            : "Hành trình đã dừng lại."}
      </p>
      <div className="ending-stats">
        <div>
          <strong>{survivors}</strong>
          <span>Người sống sót</span>
        </div>
        <div>
          <strong>{state.world.tick}h</strong>
          <span>Thời gian thế giới</span>
        </div>
        <div>
          <strong>
            {
              Object.values(state.inventory.artifactInstances).filter(
                (entry) => entry.ownerId === state.player.convoyId,
              ).length
            }
          </strong>
          <span>Kỳ vật giữ được</span>
        </div>
        <div>
          <strong>{convoy?.vehicle.condition ?? 0}%</strong>
          <span>Tình trạng xe</span>
        </div>
      </div>
      <p className="muted">
        Bạn có thể xem lại nhật ký, lưu kết cục, hoặc về menu để bắt đầu một
        hành trình khác.
      </p>
    </section>
  );
}

function RecentLog({ state }: { state: GameState }) {
  const definition = useDefinition();
  const rows = state.commandLog
    .flatMap((record) =>
      record.events.flatMap((event) => {
        const payload = event.payload;
        if (payload.type === "event.resolved")
          return [
            {
              id: event.id,
              tick: event.tick,
              text:
                definition.campaign?.texts[payload.outcomeKey] ??
                payload.eventId,
            },
          ];
        if (payload.type === "convoy.moved")
          return [
            {
              id: event.id,
              tick: event.tick,
              text: `Đã tới ${definition.locations.find((entry) => entry.id === payload.to)?.name ?? payload.to}.`,
            },
          ];
        if (payload.type === "travel.hazard")
          return [
            {
              id: event.id,
              tick: event.tick,
              text: `Chướng ngại trên đường. Xe hư hại ${payload.damage}.`,
            },
          ];
        if (payload.type === "expedition.scouted")
          return [
            {
              id: event.id,
              tick: event.tick,
              text: `Trinh sát: giảm ${payload.riskReductionBps / 100}% rủi ro đến T${payload.expiresAt}${payload.firstVisit ? ", đã nhận cache và XP." : ", cache đã lấy trước đó."}`,
            },
          ];
        if (payload.type === "expedition.rested")
          return [
            {
              id: event.id,
              tick: event.tick,
              text: `Nghỉ ${payload.ticks}h: +${payload.healthRestored} HP, +${payload.energyRestored} năng lượng.`,
            },
          ];
        if (payload.type === "vehicle.repaired")
          return [
            {
              id: event.id,
              tick: event.tick,
              text: `Sửa xe: +${payload.amount} tình trạng, −${payload.scrapCost} phế liệu.`,
            },
          ];
        if (payload.type === "combat.victory")
          return [
            {
              id: event.id,
              tick: event.tick,
              text: `Thắng trận: +${payload.rewards.food} food, +${payload.rewards.water} water, +${payload.xp} XP/người. Loot đã vào kho.`,
            },
          ];
        if (payload.type === "combat.ended")
          return [
            {
              id: event.id,
              tick: event.tick,
              text: `Trận chiến kết thúc: ${{ victory: "chiến thắng", defeat: "thất bại", retreat: "rút lui", negotiated: "đàm phán", surrendered: "đầu hàng" }[payload.result]}.`,
            },
          ];
        if (payload.type === "actor.configured")
          return [
            {
              id: event.id,
              tick: event.tick,
              text: `${state.actors[payload.actorId]?.name}: ${payload.upgradeId ? "đã dùng 1 điểm huấn luyện" : "đã đổi thế đánh"}, không trôi giờ.`,
            },
          ];
        return [];
      }),
    )
    .slice(-4)
    .reverse();
  return (
    <section className="panel recent-log">
      <p className="eyebrow">NHẬT KÝ HÀNH TRÌNH</p>
      {rows.length ? (
        rows.map((row) => (
          <p key={row.id}>
            <time>T{String(row.tick).padStart(2, "0")}</time>
            <span>{row.text}</span>
          </p>
        ))
      ) : (
        <p className="muted">
          Động cơ vẫn còn ấm. Hành trình bắt đầu từ lựa chọn của bạn.
        </p>
      )}
    </section>
  );
}

export default function App() {
  const game = useGame();
  return (
    <DefinitionContext.Provider value={game.definition}>
      <GameView game={game} />
    </DefinitionContext.Provider>
  );
}

function GameView({ game }: { game: ReturnType<typeof useGame> }) {
  const definition = useDefinition();
  const [tab, setTab] = useState("map");
  const [inScenarioBriefing, setInScenarioBriefing] = useState(false);
  const state = game.state;
  const toast = game.message && (
    <div className="toast" role="status">
      <span>{game.message}</span>
      <button
        className="text-button"
        aria-label="Đóng thông báo"
        onClick={game.dismiss}
      >
        ×
      </button>
    </div>
  );
  if (!state)
    return (
      <>
        <MainMenu
          start={(seed) => {
            setTab("map");
            game.start(seed);
          }}
          load={game.load}
          audio={game.audio}
        />
        {toast}
      </>
    );
  const convoy = state.convoys[state.player.convoyId];
  if (!convoy) return null;
  const location = definition.locations.find(
    (entry) => entry.id === convoy.locationId,
  );
  const region = definition.regions.find(
    (entry) => entry.id === location?.regionId,
  );
  const day = Math.floor(state.world.tick / 24) + 1;
  const hour = state.world.tick % 24;
  const alive = convoy.actorIds.filter(
    (id) => state.actors[id]?.status !== "dead",
  ).length;
  const operations = operationPreview(state, "wait", definition);
  const isScenarioActive =
    inScenarioBriefing || (state.scenario && !state.scenario.installedModuleId);
  const tabs = [
    ["map", "Bản đồ hành trình"],
    ["crew", "Đoàn xe"],
    ["inventory", "Kho đồ"],
    ["journal", "Nhiệm vụ & manh mối"],
  ];
  if (
    import.meta.env.DEV ||
    new URLSearchParams(window.location.search).has("debug")
  )
    tabs.push(["debug", "Chẩn đoán"]);
  return (
    <div className="game-shell">
      <header className="topbar">
        <Brand />
        <div className="world-clock">
          <span className="signal-dot" />
          NGÀY {String(day).padStart(2, "0")}
          <strong>{String(hour).padStart(2, "0")}:00</strong>
        </div>
        <div className="save-controls">
          <AudioControl audio={game.audio} />
          <button className="button subtle" onClick={game.save}>
            Lưu game
          </button>
          <button className="button subtle" onClick={() => game.load()}>
            Tải game
          </button>
          <button className="button subtle" onClick={game.menu}>
            Menu
          </button>
        </div>
      </header>
      <div className="resource-bar">
        {RESOURCE_IDS.map((id) => (
          <div
            className={`resource ${convoy.resources[id] < 6 ? "low" : ""} ${game.report?.net[id] ? (game.report.net[id] > 0 ? "resource-gained" : "resource-spent") : ""}`}
            key={`${id}-${game.report?.id ?? "start"}`}
          >
            <span className="resource-icon">{resourceSymbols[id]}</span>
            <span>
              <small>{resourceLabels[id]}</small>
              <strong>{convoy.resources[id]}</strong>
              {!!game.report?.net[id] && (
                <em className="resource-change">
                  {game.report.net[id] > 0 ? "+" : ""}
                  {game.report.net[id]}
                </em>
              )}
            </span>
          </div>
        ))}
        <div className="vehicle-status">
          <Meter
            label={convoy.vehicle.name}
            value={convoy.vehicle.condition}
            max={convoy.vehicle.maxCondition}
            danger={convoy.vehicle.condition < 30}
          />
        </div>
        <div className="crew-count">
          <strong>{alive}</strong>
          <small>NGƯỜI SỐNG</small>
        </div>
      </div>
      <main className="game-main">
        {!definition.campaign?.operations && (
          <div className="legacy-banner">
            Hành trình v0.1 được giữ nguyên rules/save. Bắt đầu chuyến mới từ
            Menu để chơi trinh sát, huấn luyện và encounter R1.
          </div>
        )}
        <div className="location-heading">
          <div>
            <p className="eyebrow">
              {region?.name} / HÀNH TRÌNH #{state.initialSeed}
            </p>
            <h1>
              {state.combat
                ? "Không còn đường lùi dễ dàng."
                : state.status !== "active"
                  ? "Câu chuyện của đoàn."
                  : location?.name}
            </h1>
          </div>
          <span className="chapter-chip">
            {location?.regionId === "region.city"
              ? "MÀN 01"
              : location?.regionId === "region.hospital"
                ? "MÀN 02"
                : "MÀN 03"}
            <span>●</span>
          </span>
        </div>
        {state.status !== "active" ? (
          <Ending state={state} />
        ) : state.combat ? (
          <CombatPanel state={state} dispatch={game.dispatch} />
        ) : inScenarioBriefing || (state.scenario && !state.scenario.installedModuleId) ? (
          <ScenarioScene
            state={state}
            dispatch={game.dispatch}
            onCancel={() => setInScenarioBriefing(false)}
          />
        ) : (
          <>
            <nav className="tabs" aria-label="Màn hình game">
              {tabs.map(([id, label]) => (
                <button
                  key={id}
                  className={tab === id ? "active" : ""}
                  aria-current={tab === id ? "page" : undefined}
                  onClick={() => setTab(id ?? "map")}
                >
                  {label}
                </button>
              ))}
            </nav>
            {tab === "map" && (
              <>
                <div className="reserve-line">
                  <span>
                    Khẩu phần còn khoảng{" "}
                    <strong>{operations.reserveHours} giờ</strong>
                  </span>
                  <span>
                    Mỗi giờ: {operations.costs.food} food + {operations.costs.water}{" "}
                    water · đang có {convoy.vehicle.condition}% xe
                  </span>
                  {state.campaign?.operations?.recon[convoy.locationId] && (
                    <span className="intel-badge">
                      ⌖ Intel{" "}
                      {Math.max(
                        0,
                        state.campaign.operations.recon[convoy.locationId]!
                          .expiresAt - state.world.tick,
                      )}
                      h
                    </span>
                  )}
                </div>
                {game.report && (
                  <ActionReportPanel
                    key={game.report.id}
                    report={game.report}
                    close={game.dismissReport}
                  />
                )}
                {convoy.locationId === "location.market" &&
                  !state.world.facts["cache.secured"] && (
                    <div className="scenario-entry-card">
                      <span className="threat-tier tier-2">NHIỆM VỤ HIỆN TRƯỜNG</span>
                      <h3>🔦 NHIỆM VỤ ĐỘT KÍCH: CHỢ MẤT ĐIỆN</h3>
                      <p>
                        Khu chợ đầu mối chìm trong bóng tối sau sự cố ngắt điện. Hà đang bị kẹt phía trong
                        và toán cướp kho đang rải người canh gác. Bạn cần đưa người vào trinh sát, cứu người
                        và thu hồi các module nâng cấp giá trị cho đoàn xe.
                      </p>
                      <button
                        type="button"
                        className="button primary pulse-btn"
                        onClick={() => setInScenarioBriefing(true)}
                      >
                        TIẾN VÀO HIỆN TRƯỜNG KHU CHỢ <span>↗</span>
                      </button>
                    </div>
                  )}
                <div className="main-grid production-art">
                  <WorldMap state={state} dispatch={game.dispatch} />
                  <EventPanel state={state} dispatch={game.dispatch} />
                </div>
                <div className="below-map">
                  <CrewConsole state={state} dispatch={game.dispatch} compact />
                  <RecentLog state={state} />
                </div>
              </>
            )}
            {tab === "crew" && <CrewConsole state={state} dispatch={game.dispatch} />}
            {tab === "inventory" && <Inventory state={state} />}
            {tab === "journal" && <Journal state={state} />}
            {tab === "debug" && <DebugPanel state={state} />}
          </>
        )}
      </main>
      {!state.combat && !isScenarioActive && tab === "map" && <ActionDeck state={state} dispatch={game.dispatch} />}
      <footer className="game-footer">
        <span>LAST CONVOY / R1</span>
        <span>MỘT CHUYẾN XE. MỌI QUYẾT ĐỊNH ĐỀU CÓ HẬU QUẢ.</span>
        <span>SEED {state.initialSeed}</span>
      </footer>
      {toast}
    </div>
  );
}

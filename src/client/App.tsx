import { useEffect, useState } from "react";
import { DefinitionContext } from "./definition";
import { useGame } from "./use-game";
import { usePresentation } from "./argon/use-presentation";
import { useTravel } from "./argon/use-travel";
import { TravelCinematic } from "./argon/TravelCinematic";
import { OpeningCinematic } from "./argon/OpeningCinematic";
import { openingAvailable } from "./argon/opening-media";
import { CombatStage } from "./argon/CombatStage";
import { SceneScreen } from "./argon/SceneScreen";
import { StrategicMap } from "./argon/StrategicMap";
import { RESOURCE_IDS } from "../core/primitives";
import { resourceLabels, Costs } from "./components/shared";
import { CrewConsole } from "./components/CrewConsole";
import { Inventory } from "./components/Convoy";
import { Journal } from "./components/Journal";
import { LoreScreen } from "./argon/LoreScreen";
import { PathwaysScreen } from "./argon/PathwaysScreen";
import { ScenarioScene } from "./components/ScenarioScene";
import { AssetArt } from "./components/AssetArt";

export default function App() {
  const game = useGame();
  const [page, setPage] = useState("scene");
  const [opening, setOpening] = useState(false);
  const [briefing, setBriefing] = useState(false);
  const [seed, setSeed] = useState("42");
  const [seedError, setSeedError] = useState("");
  const presentation = usePresentation(
    game.state,
    game.transition,
    game.audio.playBeat,
  );
  const travel = useTravel(game.state, game.transition);
  useEffect(() => {
    if (
      game.transition?.events.some((e) => e.payload.type === "convoy.moved")
    ) {
      setPage("scene");
      setBriefing(false);
    }
  }, [game.transition]);
  const state = game.state;
  const view = presentation.frame;
  const convoy = state?.convoys[state.player.convoyId];
  const scenario =
    Boolean(state?.scenario && !state.scenario.installedModuleId) ||
    (briefing && !state?.scenario);
  const returnToMenu = () => {
    setBriefing(false);
    setPage("scene");
    presentation.skip();
    game.menu();
  };
  const loadJourney = (slot?: string) => {
    setBriefing(false);
    setPage("scene");
    presentation.skip();
    game.load(slot);
  };
  const text = (key: string) => game.definition.campaign?.texts[key] ?? key;
  const navigate = (next: string) => {
    setPage(next);
    setBriefing(false);
  };
  return (
    <DefinitionContext.Provider value={game.definition}>
      <div
        className={`argon-shell ${state ? "in-game" : "at-menu"}`}
        inert={Boolean(travel.shot) || opening}
      >
        <header className="argon-header">
          <button
            className="wordmark"
            onClick={returnToMenu}
            aria-label="Trở về menu"
          >
            LAST <span>CONVOY</span>
            <small>CHUYẾN XE CUỐI CÙNG</small>
          </button>
          {state && (
            <nav aria-label="Điều hướng">
              <button
                className={page === "scene" ? "current" : ""}
                onClick={() => navigate("scene")}
                disabled={Boolean(state.combat)}
              >
                HIỆN TRƯỜNG
              </button>
              <button
                className={page === "map" ? "current" : ""}
                onClick={() => navigate("map")}
                disabled={Boolean(state.combat) || scenario}
              >
                BẢN ĐỒ
              </button>
              <button
                onClick={() => navigate("crew")}
                disabled={Boolean(state.combat) || scenario}
              >
                ĐOÀN XE
              </button>
              <button
                onClick={() => navigate("inventory")}
                disabled={Boolean(state.combat) || scenario}
              >
                KỲ VẬT
              </button>
              <button
                onClick={() => navigate("journal")}
                disabled={Boolean(state.combat) || scenario}
              >
                {game.definition.campaign?.resonance ? "HỒ SƠ" : "SỔ TAY"}
              </button>
              {game.definition.campaign?.resonance && (
                <button
                  onClick={() => navigate("pathways")}
                  disabled={Boolean(state.combat) || scenario}
                >
                  SIÊU PHÀM
                </button>
              )}
            </nav>
          )}
          <div className="header-controls">
            <details className="audio-settings">
              <summary aria-label="Cài đặt âm thanh">≋</summary>
              <div>
                <strong>Âm thanh</strong>
                <small className="audio-status">{game.audio.status}</small>
                <label>
                  Tổng
                  <input
                    aria-label="Âm lượng tổng"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={game.audio.volume}
                    onChange={(e) =>
                      game.audio.setVolume(Number(e.target.value))
                    }
                  />
                </label>
                {(["music", "sfx", "ambience"] as const).map((channel, i) => (
                  <label key={channel}>
                    {["Nhạc nền", "Hiệu ứng", "Môi trường"][i]}
                    <input
                      aria-label={`Âm lượng ${channel}`}
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={
                        channel === "music"
                          ? game.audio.musicVolume
                          : channel === "sfx"
                            ? game.audio.sfxVolume
                            : game.audio.ambienceVolume
                      }
                      onChange={(e) =>
                        game.audio.setMix(channel, Number(e.target.value))
                      }
                    />
                  </label>
                ))}
              </div>
            </details>
            <button
              onClick={() => game.audio.setEnabled(!game.audio.enabled)}
              aria-label={game.audio.enabled ? "Tắt âm thanh" : "Bật âm thanh"}
            >
              {game.audio.enabled ? "♫" : "♪"}
            </button>
            {state && (
              <>
                <button onClick={game.save}>Lưu</button>
                <button
                  onClick={() => {
                    loadJourney();
                  }}
                >
                  Tải
                </button>
                <time>
                  NGÀY {Math.floor(state.world.tick / 24) + 1}{" "}
                  <b>{String(state.world.tick % 24).padStart(2, "0")}:00</b>
                </time>
              </>
            )}
          </div>
        </header>
        {state && convoy && (
          <div className="survival-hud">
            {RESOURCE_IDS.map((id, i) => (
              <div key={id} className={convoy.resources[id] < 6 ? "low" : ""}>
                <span>{["◒", "◈", "▰", "✚", "⚙"][i]}</span>
                <strong>{convoy.resources[id]}</strong>
                <small>{resourceLabels[id]}</small>
              </div>
            ))}
            <div className="hud-vehicle">
              <span>▰</span>
              <strong>{convoy.vehicle.condition}%</strong>
              <small>ĐỘ BỀN XE</small>
            </div>
            <div className="rules-label">
              {game.definition.campaign?.tactics
                ? "CHIẾN DỊCH BẮC SƠN"
                : "HÀNH TRÌNH CŨ"}
            </div>
          </div>
        )}
        {!state ? (
          <main className="argon-menu">
            <div className="menu-haze" />
            <div className="menu-intro">
              <span className="kicker">CHIẾN THUẬT · SINH TỒN · QUỶ DỊ</span>
              <h1>
                Đừng để
                <br />
                đèn <em>tắt.</em>
              </h1>
              <p>
                Một đoàn xe giữa thành phố đã chết.
                <br />
                Ba người còn sống. Và những thứ đang gọi tên họ.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const n = Number(seed);
                  if (
                    !/^\d+$/.test(seed) ||
                    !Number.isSafeInteger(n) ||
                    n < 0 ||
                    n > 0xffffffff
                  ) {
                    setSeedError(
                      "Mã hành trình cần là số nguyên từ 0 đến 4294967295.",
                    );
                    return;
                  }
                  setSeedError("");
                  setPage("scene");
                  setBriefing(false);
                  game.start(n);
                  setOpening(openingAvailable);
                }}
              >
                <label htmlFor="seed">MÃ HÀNH TRÌNH</label>
                <input
                  id="seed"
                  value={seed}
                  inputMode="numeric"
                  onChange={(e) => setSeed(e.target.value)}
                />
                <button className="primary" type="submit">
                  BẮT ĐẦU HÀNH TRÌNH ↗
                </button>
                {seedError && <p role="alert">{seedError}</p>}
              </form>
              <div className="menu-loads">
                {openingAvailable && (
                  <button
                    onClick={() => {
                      void game.audio.unlock();
                      setOpening(true);
                    }}
                  >
                    Xem mở đầu ▷
                  </button>
                )}
                <button onClick={() => loadJourney("autosave")}>
                  Tiếp tục hành trình
                </button>
                <button onClick={() => loadJourney("journey")}>
                  Tải Journey cũ
                </button>
                <button onClick={() => loadJourney("o1")}>Tải Argon O1</button>
                <button onClick={() => loadJourney("r1")}>
                  Tải hành trình R1
                </button>
                <button onClick={() => loadJourney("legacy")}>Tải v0.1</button>
              </div>
            </div>
            <div className="menu-caption">
              <span>01 / THÀNH PHỐ TẮT ĐÈN</span>
              <p>Phía trước vẫn còn đường.</p>
            </div>
          </main>
        ) : state.status !== "active" && !presentation.busy ? (
          <main className="ending-screen">
            <AssetArt
              id="asset.location.refuge"
              kind="location"
              label="Bắc Sơn"
            />
            <div className="metal-panel">
              <small>HÀNH TRÌNH ĐÃ KHÉP LẠI</small>
              <h1>
                {state.status === "won"
                  ? text(
                      game.definition.campaign?.endings.find(
                        (e) => e.id === state.ending?.id,
                      )?.titleKey ?? "",
                    ) || "Bình minh còn đó."
                  : "Ánh đèn tắt dần."}
              </h1>
              <p>
                {state.status === "won"
                  ? text(
                      game.definition.campaign?.endings.find(
                        (e) => e.id === state.ending?.id,
                      )?.textKey ?? "",
                    )
                  : "Đoàn xe không thể tiếp tục. Những lựa chọn đã đưa bạn tới đây."}
              </p>
              <button className="primary" onClick={returnToMenu}>
                Trở về menu
              </button>
            </div>
          </main>
        ) : (state.combat || (presentation.busy && view?.combat)) && view ? (
          <CombatStage
            key={`${game.session}:${state.combat?.id ?? view.combat?.id}`}
            state={view}
            decision={state.combat ? state : view}
            beat={presentation.beat}
            busy={presentation.busy}
            skip={presentation.skip}
            dispatch={game.dispatch}
          />
        ) : scenario ? (
          <main className="scenario-workspace">
            <ScenarioScene
              state={state}
              dispatch={game.dispatch}
              onCancel={() => setBriefing(false)}
            />
          </main>
        ) : page === "pathways" ? (
          <PathwaysScreen state={state} dispatch={game.dispatch} />
        ) : page === "journal" && game.definition.campaign?.resonance ? (
          <LoreScreen state={state} />
        ) : page === "map" ? (
          <StrategicMap state={state} dispatch={game.dispatch} />
        ) : page === "crew" || page === "inventory" || page === "journal" ? (
          <main className="management-screen">
            <div className="management-heading">
              <span className="kicker">NHỮNG GÌ GIỮ CHÚNG TA CÒN SỐNG</span>
              <button onClick={() => navigate("scene")}>
                ← Trở về hiện trường
              </button>
            </div>
            {page === "crew" ? (
              <CrewConsole state={state} dispatch={game.dispatch} />
            ) : page === "inventory" ? (
              <Inventory state={state} />
            ) : (
              <Journal state={state} />
            )}
          </main>
        ) : (
          <SceneScreen
            state={state}
            dispatch={game.dispatch}
            openMap={() => navigate("map")}
            openCrew={() => navigate("crew")}
            startScenario={() => setBriefing(true)}
          />
        )}
        {game.report && !state?.combat && !scenario && (
          <aside className="transition-note" aria-live="polite">
            <div>
              <small>SAU QUYẾT ĐỊNH</small>
              <strong>{game.report.title}</strong>
              <p>{game.report.narrative}</p>
              <Costs resources={game.report.costs} />
            </div>
            <button onClick={game.dismissReport} aria-label="Đóng kết quả">
              ×
            </button>
          </aside>
        )}
        {game.message && (
          <div className="argon-toast" role="status">
            {game.message}
            <button onClick={game.dismiss} aria-label="Đóng thông báo">
              ×
            </button>
          </div>
        )}
      </div>
      {opening && (
        <OpeningCinematic
          finish={() => setOpening(false)}
          volume={
            game.audio.enabled
              ? game.audio.volume * game.audio.ambienceVolume
              : 0
          }
        />
      )}
      {travel.shot && (
        <TravelCinematic
          key={travel.shot.key}
          shot={travel.shot}
          finish={travel.skip}
          motor={game.audio.startTravel}
        />
      )}
    </DefinitionContext.Provider>
  );
}

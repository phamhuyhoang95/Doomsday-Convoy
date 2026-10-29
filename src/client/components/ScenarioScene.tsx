import { useState } from "react";
import type { GameCommand } from "../../core/commands";
import type { GameState } from "../../core/state-schema";
import { marketBlackoutScenario } from "../../content/scenarios";

interface ScenarioSceneProps {
  state: GameState;
  dispatch: (payload: GameCommand["payload"]) => void;
  onCancel?: () => void;
}

export function ScenarioScene({ state, dispatch, onCancel }: ScenarioSceneProps) {
  const scenario = state.scenario;
  const convoyId = state.player.convoyId;
  const convoy = state.convoys[convoyId];

  // Briefing state if scenario not yet started
  const [selectedScouts, setSelectedScouts] = useState<string[]>([
    "character.minh",
    "character.bao",
  ]);
  const [selectedGuard, setSelectedGuard] = useState<string>("character.lan");
  const [selectedModule, setSelectedModule] = useState<"module.fuel-tank" | "module.triage-unit">(
    "module.fuel-tank",
  );

  if (!convoy) return null;

  // 1. Briefing modal / screen if not started
  if (!scenario || scenario.phase === "planning") {
    const availableCrew = convoy.actorIds;
    const canStart =
      selectedScouts.length === 2 &&
      selectedGuard &&
      !selectedScouts.includes(selectedGuard);

    return (
      <div className="scenario-shell">
        <div className="scenario-briefing-panel">
          <div className="briefing-header">
            <span className="threat-tier tier-2">NHIỆM VỤ ĐỘT KÍCH HIỆN TRƯỜNG</span>
            <h2>CHỢ MẤT ĐIỆN</h2>
            <p className="briefing-desc">{marketBlackoutScenario.description}</p>
          </div>

          <div className="briefing-rules">
            <div className="rule-card">
              <strong>👥 PHÂN CÔNG ĐỘI HÌNH:</strong>
              <p>Chọn 2 người tiến vào chợ trinh sát và 1 người ở lại xe tải canh chừng, giữ máy nổ.</p>
            </div>
            <div className="rule-card">
              <strong>👁️ CHỈ SỐ CẢNH GIỚI (ALERT):</strong>
              <p>Hành động ồn ào hoặc nổ máy phát sẽ tăng Cảnh giới (tối đa 6). Cảnh giới cao sẽ kích hoạt toán cướp bao vây!</p>
            </div>
            <div className="rule-card">
              <strong>🎒 SỨC CHỨA CÓ HẠN (TỐI ĐA 2 KIỆN):</strong>
              <p>Đội ngoài chỉ có thể vác tối đa 2 kiện hàng (Xăng, Phế liệu hoặc Máy phát điện) về xe.</p>
            </div>
          </div>

          <div className="crew-selection-section">
            <div className="scout-picker">
              <label>
                <strong>CHỌN 2 NGƯỜI VÀO HIỆN TRƯỜNG:</strong>
                <small> (Năng lực nhân vật mở ra các phương án tiếp cận khác nhau)</small>
              </label>
              <div className="crew-buttons">
                {availableCrew.map((id) => {
                  const actor = state.actors[id];
                  const isScout = selectedScouts.includes(id);
                  const isGuard = selectedGuard === id;
                  const roleName =
                    actor?.id === "character.minh"
                      ? "Chỉ huy (Bọc lót)"
                      : actor?.id === "character.bao"
                        ? "Thợ máy (Đấu dây êm)"
                        : "Y sĩ (Sơ cứu)";

                  return (
                    <button
                      key={id}
                      type="button"
                      className={`button crew-btn ${isScout ? "primary selected" : ""}`}
                      disabled={isGuard}
                      onClick={() => {
                        if (isScout) {
                          setSelectedScouts(selectedScouts.filter((s) => s !== id));
                        } else if (selectedScouts.length < 2) {
                          setSelectedScouts([...selectedScouts, id]);
                        }
                      }}
                    >
                      <span className="crew-name">{actor?.name}</span>
                      <small className="crew-role">{roleName}</small>
                      {isScout && <span className="check-mark"> ✓ Đội ngoài</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="guard-picker">
              <label>
                <strong>CHỌN 1 NGƯỜI GIỮ XE:</strong>
                <small> (Canh gác và sẵn sàng nổ máy yểm trợ rút lui)</small>
              </label>
              <div className="crew-buttons">
                {availableCrew.map((id) => {
                  const actor = state.actors[id];
                  const isScout = selectedScouts.includes(id);
                  const isGuard = selectedGuard === id;

                  return (
                    <button
                      key={id}
                      type="button"
                      className={`button crew-btn ${isGuard ? "primary selected" : ""}`}
                      disabled={isScout}
                      onClick={() => setSelectedGuard(id)}
                    >
                      <span className="crew-name">{actor?.name}</span>
                      {isGuard && <span className="check-mark"> ✓ Giữ xe</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="briefing-actions">
            {onCancel && (
              <button
                type="button"
                className="button text-button"
                onClick={onCancel}
              >
                ← Quay lại bản đồ
              </button>
            )}
            <button
              type="button"
              className="button primary pulse-btn"
              disabled={!canStart}
              onClick={() => {
                dispatch({
                  type: "scenario-start",
                  convoyId,
                  scenarioId: marketBlackoutScenario.id,
                  scoutIds: selectedScouts,
                  guardId: selectedGuard,
                });
              }}
            >
              TIẾN VÀO KHU CHỢ <span>↗</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Debrief & Module Selection modal if completed/evacuated
  if (
    (scenario.phase === "completed" || scenario.phase === "evacuated") &&
    scenario.installedModuleId === null
  ) {
    return (
      <div className="scenario-shell">
        <div className="scenario-debrief-panel">
          <div className="briefing-header">
            <span className={`threat-tier ${scenario.phase === "completed" ? "tier-1" : "tier-3"}`}>
              {scenario.phase === "completed" ? "ĐỘT KÍCH THÀNH CÔNG" : "ĐÃ RÚT LUI KHẨN CẤP"}
            </span>
            <h2>TỔNG KẾT CHIẾN DỊCH: CHỢ MẤT ĐIỆN</h2>
            <p className="briefing-desc">
              Đội thám hiểm đã an toàn trở lại xe tải. Hãy kiểm tra thành quả và lựa chọn
              nâng cấp module cho đoàn xe trước khi tiếp tục hành trình.
            </p>
          </div>

          <div className="debrief-summary">
            <div className="summary-item">
              <strong>Hà:</strong>
              <span>
                {scenario.rescuedHa
                  ? "✓ Đã cứu thành công — gia nhập đoàn xe!"
                  : "✗ Không kịp giải cứu"}
              </span>
            </div>
            <div className="summary-item">
              <strong>Chiến lợi phẩm mang về:</strong>
              <span>
                {scenario.cargo.length > 0
                  ? scenario.cargo
                      .map((c) =>
                        c === "cargo.fuel"
                          ? "Can Xăng (+15)"
                          : c === "cargo.scrap"
                            ? "Phế liệu (+10)"
                            : "Máy phát điện (+10 Xăng, +10 Phế liệu)",
                      )
                      .join(", ")
                  : "Không mang được kiện hàng nào."}
              </span>
            </div>
            <div className="summary-item">
              <strong>Mức độ kinh động:</strong>
              <span>{scenario.alert} / {scenario.maxAlert}</span>
            </div>
          </div>

          <div className="module-choice-section">
            <h3>LỰA CHỌN MODULE NÂNG CẤP ĐOÀN XE</h3>
            <p className="eyebrow">TÁC ĐỘNG VĨNH VIỄN LÊN CÁC CHUYẾN DI CHUYỂN TIẾP THEO</p>

            <div className="module-options">
              <label
                className={`module-card ${selectedModule === "module.fuel-tank" ? "active" : ""}`}
                onClick={() => setSelectedModule("module.fuel-tank")}
              >
                <input
                  type="radio"
                  name="module"
                  checked={selectedModule === "module.fuel-tank"}
                  onChange={() => setSelectedModule("module.fuel-tank")}
                />
                <div className="module-content">
                  <strong>🛢️ Thùng Nhiên Liệu Phụ (Fuel Tank)</strong>
                  <p>
                    Gia cố bình chứa phụ trên nóc xe tải.
                    <br />
                    <em className="gain">Giảm 20% lượng xăng tiêu hao trên mọi chặng đường tiếp theo.</em>
                  </p>
                </div>
              </label>

              <label
                className={`module-card ${selectedModule === "module.triage-unit" ? "active" : ""}`}
                onClick={() => setSelectedModule("module.triage-unit")}
              >
                <input
                  type="radio"
                  name="module"
                  checked={selectedModule === "module.triage-unit"}
                  onChange={() => setSelectedModule("module.triage-unit")}
                />
                <div className="module-content">
                  <strong>🩺 Trạm Sơ Cứu Dã Chiến (Triage Unit)</strong>
                  <p>
                    Lắp đặt băng ca và tủ thuốc cố định trong thùng xe.
                    <br />
                    <em className="gain">Tự động hồi phục 6 HP cho thuyền viên bị thương sau mỗi chuyến đi.</em>
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="briefing-actions">
            <button
              type="button"
              className="button primary pulse-btn"
              onClick={() => {
                dispatch({
                  type: "scenario-finish",
                  convoyId,
                  chosenModuleId: selectedModule,
                });
              }}
            >
              LẮP MODULE & LÊN ĐƯỜNG <span>↗</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Exploring / Crisis Phase Scene View
  const currentNode = marketBlackoutScenario.nodes.find(
    (n) => n.id === scenario.currentNodeId,
  );
  const connectedNodes = marketBlackoutScenario.nodes.filter((n) =>
    currentNode?.connectedNodeIds.includes(n.id),
  );

  const scoutNames = scenario.scoutIds
    .map((id) => state.actors[id]?.name ?? id)
    .join(", ");
  const guardName = state.actors[scenario.guardId]?.name ?? scenario.guardId;

  return (
    <div className="scenario-scene-container">
      {/* Top HUD Bar */}
      <div className="scenario-hud">
        <div className="hud-badge alert-meter">
          <span className="hud-label">CẢNH GIỚI:</span>
          <div className="meter-blocks">
            {Array.from({ length: scenario.maxAlert }).map((_, i) => (
              <span
                key={i}
                className={`meter-block ${i < scenario.alert ? "active" : ""} ${
                  scenario.alert >= 4 ? "critical" : ""
                }`}
              />
            ))}
          </div>
          <span className="meter-text">
            {scenario.alert}/{scenario.maxAlert}
            {scenario.alert >= 4 && " (NGUY HIỂM!)"}
          </span>
        </div>

        <div className="hud-badge cargo-meter">
          <span className="hud-label">BA-LÔ ({scenario.cargo.length}/{scenario.maxCargo}):</span>
          <div className="cargo-slots">
            {scenario.cargo.length === 0 ? (
              <span className="slot empty">Trống</span>
            ) : (
              scenario.cargo.map((item, idx) => (
                <span key={idx} className="slot filled">
                  {item === "cargo.fuel"
                    ? "Xăng (15L)"
                    : item === "cargo.scrap"
                      ? "Phế liệu"
                      : "Máy phát"}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="hud-badge power-badge">
          <span className="hud-label">ĐIỆN:</span>
          <span className={`power-status ${scenario.powerOn ? "on" : "off"}`}>
            {scenario.powerOn ? "⚡ ĐÃ BẬT" : "TẮT"}
          </span>
        </div>

        <div className="hud-badge ha-badge">
          <span className="hud-label">HÀ:</span>
          <span className={scenario.rescuedHa ? "rescued" : "trapped"}>
            {scenario.rescuedHa ? "✓ Đã cứu" : "Kẹt buồng kín"}
          </span>
        </div>

        <div className="hud-badge crew-badge">
          <small>Đội ngoài: {scoutNames} | Giữ xe: {guardName}</small>
        </div>
      </div>

      {/* Interactive Visual Map Scene */}
      <div className="scenario-viewport">
        <img
          src="/art/r4/market-blackout.jpg"
          alt="Bản đồ hiện trường Chợ Mất Điện"
          className="scenario-background"
        />

        {/* Hotspots overlay */}
        {marketBlackoutScenario.nodes.map((node) => {
          const isCurrent = node.id === scenario.currentNodeId;
          const isConnected = currentNode?.connectedNodeIds.includes(node.id);
          const isVisited = scenario.visitedNodeIds.includes(node.id);

          return (
            <div
              key={node.id}
              className={`node-hotspot ${isCurrent ? "current" : ""} ${
                isConnected ? "connected" : ""
              } ${isVisited ? "visited" : ""}`}
              style={{ left: `${node.xPercent}%`, top: `${node.yPercent}%` }}
              onClick={() => {
                if (isConnected && scenario.phase === "exploring") {
                  dispatch({
                    type: "scenario-move",
                    convoyId,
                    targetNodeId: node.id,
                  });
                }
              }}
            >
              <div className="hotspot-pin">
                {isCurrent && <span className="pin-pulse" />}
                <span className="pin-icon">{isCurrent ? "📍" : isConnected ? "↗" : "●"}</span>
              </div>
              <div className="hotspot-label">
                <strong>{node.name}</strong>
                {isCurrent && <small className="tag current-tag">Vị trí hiện tại</small>}
                {isConnected && !isCurrent && (
                  <small className="tag move-tag">Click để di chuyển</small>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Action & Narrative Panel */}
      <div className="scenario-bottom-panel">
        <div className="node-detail">
          <div className="node-header">
            <span className="eyebrow">{currentNode?.roleHint}</span>
            <h3>{currentNode?.name}</h3>
            <p className="node-desc">{currentNode?.description}</p>
          </div>

          {/* Node Actions */}
          <div className="node-actions-list">
            <h4>HÀNH ĐỘNG TẠI KHU VỰC:</h4>
            {currentNode?.actions.length === 0 ? (
              <p className="empty-actions">
                Đây là bãi đỗ xe của đoàn. Bạn có thể rút lui an toàn về xe tải khi hoàn thành mục tiêu.
              </p>
            ) : (
              <div className="actions-grid">
                {currentNode?.actions.map((act) => {
                  const isDone = scenario.completedActionIds.includes(act.id);
                  const meetsRole =
                    !act.requiredRole ||
                    scenario.scoutIds.some((sId) => {
                      const actor = state.actors[sId];
                      return (
                        actor?.role === act.requiredRole ||
                        (act.requiredRole === "mechanic" && sId === "character.bao")
                      );
                    });

                  const cargoFull =
                    !!act.itemReward && scenario.cargo.length >= scenario.maxCargo;

                  return (
                    <div
                      key={act.id}
                      className={`action-card ${isDone ? "completed" : ""} ${
                        !meetsRole || cargoFull ? "disabled" : ""
                      }`}
                    >
                      <div className="action-info">
                        <strong>{act.name}</strong>
                        <p>{act.description}</p>
                        <div className="action-meta">
                          <span
                            className={`alert-cost ${
                              act.alertCost > 0 ? "loss" : "gain"
                            }`}
                          >
                            {act.alertCost > 0
                              ? `+${act.alertCost} Cảnh giới`
                              : "0 Cảnh giới (Êm ái)"}
                          </span>
                          {act.requiredRole && (
                            <span
                              className={`role-tag ${
                                meetsRole ? "role-met" : "role-missing"
                              }`}
                            >
                              {meetsRole ? "✓ Đã có Thợ máy (Bảo)" : "✗ Thiếu Thợ máy"}
                            </span>
                          )}
                          {cargoFull && (
                            <span className="cargo-full-tag">⚠️ Ba-lô đầy (2/2)</span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="button primary"
                        disabled={isDone || !meetsRole || cargoFull || scenario.phase !== "exploring"}
                        onClick={() => {
                          dispatch({
                            type: "scenario-act",
                            convoyId,
                            nodeId: currentNode.id,
                            actionId: act.id,
                          });
                        }}
                      >
                        {isDone ? "✓ Đã thực hiện" : "Hành động"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigation to connected nodes */}
          <div className="node-navigation">
            <h4>DI CHUYỂN TỚI CÁC ĐIỂM KẾ TIẾP:</h4>
            <div className="nav-buttons">
              {connectedNodes.map((target) => (
                <button
                  key={target.id}
                  type="button"
                  className="button nav-btn"
                  disabled={scenario.phase !== "exploring"}
                  onClick={() => {
                    dispatch({
                      type: "scenario-move",
                      convoyId,
                      targetNodeId: target.id,
                    });
                  }}
                >
                  <span>→ Tiến sang {target.name}</span>
                </button>
              ))}

              {currentNode?.id === "node.parking" && (
                <button
                  type="button"
                  className="button primary finish-btn"
                  disabled={scenario.phase !== "exploring"}
                  onClick={() => {
                    dispatch({
                      type: "scenario-finish",
                      convoyId,
                      chosenModuleId: "module.fuel-tank",
                    });
                  }}
                >
                  ✓ RÚT LUI AN TOÀN VỀ XE & KẾT THÚC
                </button>
              )}

              <button
                type="button"
                className="button danger-btn"
                title="Rút lui khẩn cấp (Bỏ lại hàng cồng kềnh, xe húc rào -10% độ bền)"
                onClick={() => {
                  dispatch({
                    type: "scenario-crisis",
                    convoyId,
                    method: "evacuate",
                  });
                }}
              >
                ⚠️ Rút lui khẩn cấp (Húc rào)
              </button>
            </div>
          </div>
        </div>

        {/* Mission Event Log */}
        <div className="scenario-log-box">
          <h4>NHẬT KÝ HIỆN TRƯỜNG:</h4>
          <div className="log-entries">
            {scenario.log.map((entry, idx) => (
              <div key={idx} className="log-line">
                <span className="log-dot">●</span> {entry}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Crisis Modal Overlay */}
      {scenario.phase === "crisis" && (
        <div className="scenario-crisis-overlay">
          <div className="crisis-modal">
            <span className="threat-tier tier-3">BÁO ĐỘNG ĐỎ · BỊ BAO VÂY</span>
            <h2>TOÁN CƯỚP ĐÃ PHÁT HIỆN VÀ CHẶN CỔNG BÃI XE!</h2>
            <p className="crisis-desc">
              Ánh đèn pin quét qua mặt, tiếng lên đạn lách cách vang lên trong bóng tối.
              Toán cướp kho đã phát hiện động tĩnh và vây kín lối ra về phía chiếc xe tải!
            </p>

            <div className="crisis-choices">
              <button
                type="button"
                className="button crisis-btn combat"
                onClick={() => {
                  dispatch({
                    type: "scenario-crisis",
                    convoyId,
                    method: "combat",
                  });
                }}
              >
                <div className="choice-title">⚔️ NỔ SÚNG MỞ ĐƯỜNG (CHIẾN ĐẤU)</div>
                <small>
                  Minh nổ súng áp chế! Tiêu diệt toàn bộ toán cướp để giữ trọn vẹn số hàng
                  và bảo vệ xe.
                </small>
              </button>

              <button
                type="button"
                className="button crisis-btn decoy"
                disabled={scenario.cargo.length === 0 && convoy.resources.fuel < 2}
                onClick={() => {
                  dispatch({
                    type: "scenario-crisis",
                    convoyId,
                    method: "decoy",
                  });
                }}
              >
                <div className="choice-title">🔥 NGHI BINH ĐÁNH LẠC HƯỚNG</div>
                <small>
                  {scenario.cargo.length > 0
                    ? "Ném 1 kiện hàng sang cổng phụ dụ toán cướp đuổi theo để cả đội lẻn về xe."
                    : "Đốt 2 lít xăng tạo rèm lửa đánh lạc hướng toán cướp để cả đội thoát thân."}
                </small>
              </button>

              <button
                type="button"
                className="button crisis-btn evacuate"
                onClick={() => {
                  dispatch({
                    type: "scenario-crisis",
                    convoyId,
                    method: "evacuate",
                  });
                }}
              >
                <div className="choice-title">⚡ HÚC RÀO RÚT LUI KHẨN CẤP</div>
                <small>
                  Bỏ lại toàn bộ hàng cồng kềnh, xe nhấn ga húc đổ rào chắn thoát thân
                  (-10% Độ bền xe).
                </small>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

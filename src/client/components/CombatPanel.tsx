import { useState } from "react";
import { useDefinition } from "../definition";
import { currentCombatActor } from "../../combat/engine";
import { damageRange } from "../../combat/actions";
import type { GameCommand } from "../../core/commands";
import type { GameState } from "../../core/state-schema";
import { evaluateCondition } from "../../narrative/conditions";
import { skillView } from "../../read-models/skills";
import { Meter, Costs, statusLabels } from "./shared";
import { AssetArt } from "./AssetArt";

export function CombatPanel({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: (payload: GameCommand["payload"]) => void;
}) {
  const definition = useDefinition();
  const [enemyTargetId, setEnemyTargetId] = useState("");
  const [allyTargetId, setAllyTargetId] = useState("");
  const [skillId, setSkillId] = useState<string | null>(null);
  const combat = state.combat;
  const current = currentCombatActor(state);
  if (!combat || !current) return null;
  const allies = Object.values(state.actors).filter(
    (actor) => actor.convoyId === state.player.convoyId,
  );
  const enemies = Object.values(state.actors).filter(
    (actor) => actor.convoyId === combat.enemyConvoyId,
  );
  const encounter = definition.campaign?.encounters?.find(
    (entry) => entry.convoyId === combat.enemyConvoyId,
  );
  const enemyName =
    encounter?.name ?? definition.campaign?.rival?.name ?? "Đối thủ";
  const enemy =
    enemies.find(
      (actor) => actor.id === enemyTargetId && actor.status === "active",
    ) ?? enemies.find((actor) => actor.status === "active");
  const ally =
    allies.find(
      (actor) =>
        actor.id === allyTargetId &&
        actor.status !== "dead" &&
        actor.status !== "captured",
    ) ??
    [...allies]
      .filter((actor) => actor.status !== "dead" && actor.status !== "captured")
      .sort((a, b) => a.health / a.maxHealth - b.health / b.maxHealth)[0];
  const selected = definition.campaign?.skills.find(
    (entry) => entry.id === skillId && current.skillIds?.includes(entry.id),
  );
  const targetId =
    selected?.target === "ally"
      ? ally?.id
      : selected?.target === "self"
        ? current.id
        : enemy?.id;
  const selectedView = selected
    ? skillView(state, current.id, selected.id, targetId, definition)
    : null;
  const attack = enemy
    ? damageRange(state, current.id, enemy.id, 0, definition)
    : [0, 0];
  const action = (
    type: Extract<GameCommand["payload"], { type: "combat" }>["action"],
    target?: string,
  ) => {
    setSkillId(null);
    dispatch({
      type: "combat",
      convoyId: state.player.convoyId,
      actorId: current.id,
      action: type,
      ...(target ? { targetId: target } : {}),
    });
  };
  const peaceful =
    !encounter &&
    definition.campaign?.rival &&
    evaluateCondition(state, definition.campaign.rival.negotiationCondition);
  const recent = state.commandLog.at(-1)?.events ?? [];
  const damageTo = (id: string) =>
    recent.reduce(
      (sum, event) =>
        event.payload.type === "combat.action" &&
        event.payload.targetId === id &&
        event.payload.action !== "capture"
          ? sum +
            (event.payload.action === "heal"
              ? event.payload.amount
              : -event.payload.amount)
          : sum,
      0,
    );
  const victory = [...state.commandLog]
    .reverse()
    .flatMap((record) => record.events)
    .find(
      (event) =>
        event.payload.type === "combat.victory" &&
        event.payload.enemyConvoyId === combat.enemyConvoyId,
    )?.payload;

  const hasDamageRecently = recent.some(
    (e) =>
      (e.payload.type === "combat.action" &&
        e.payload.action !== "heal" &&
        e.payload.action !== "capture" &&
        e.payload.amount > 0) ||
      e.payload.type === "travel.hazard",
  );

  const currentLocation = state.convoys[state.player.convoyId]?.locationId;
  const isAnomalyZone =
    currentLocation === "location.hospital" ||
    currentLocation === "location.ward";
  const isBossRival = !encounter && definition.campaign?.rival;
  const threatTier =
    isBossRival || isAnomalyZone
      ? {
          label: isAnomalyZone ? "CẤP 3 · DỊ TƯỢNG QUỶ DỊ" : "CẤP 3 · ĐẠI CHIẾN SINH TỬ",
          className: "tier-3",
        }
      : encounter?.id === "encounter.market-raiders"
        ? { label: "CẤP 1 · CỌ XÁT CHỢ HOANG", className: "tier-1" }
        : { label: "CẤP 2 · TRANH CHẤP VŨ TRANG", className: "tier-2" };

  const lowHealthCritical = allies.some(
    (a) => a.health < a.maxHealth * 0.28 && a.status === "active",
  );

  return (
    <section
      key={`combat-${state.commandLog.length}`}
      className={`panel combat-panel improved-combat ${hasDamageRecently ? "combat-screen-shake" : ""}`}
    >
      {(lowHealthCritical || isAnomalyZone) && <div className="pulse-vignette" />}
      <div className="panel-heading">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <p className="eyebrow" style={{ margin: 0 }}>ĐỤNG ĐỘ / {enemyName}</p>
            <span className={`threat-tier ${threatTier.className}`}>{threatTier.label}</span>
          </div>
          <h2>
            {combat.phase === "aftermath"
              ? "★ CHIẾN THẮNG — LOOT ĐÃ VÀO KHO"
              : `Vòng ${combat.round} · Lượt của ${current.name}`}
          </h2>
        </div>
        <span className="badge danger">
          {combat.phase === "active"
            ? "CHỌN MỤC TIÊU → HÀNH ĐỘNG"
            : "XỬ LÝ HẬU CHIẾN"}
        </span>
      </div>
      <div className="combat-environment">
        <AssetArt
          id={`asset.${state.convoys[state.player.convoyId]?.locationId}`}
          kind="location"
          label={enemyName}
        />
        <div>
          <AssetArt
            id={encounter ? "asset.vehicle.bus" : "asset.vehicle.rival"}
            kind="vehicle"
            label={encounter ? "Đoàn xe của bạn" : enemyName}
          />
        </div>
      </div>
      <div className="turn-order" aria-label="Thứ tự lượt">
        {combat.turnOrder.map((id) => (
          <span
            key={id}
            className={`${id === current.id ? "current-turn" : ""} ${state.actors[id]?.status !== "active" ? "turn-skipped" : ""}`}
          >
            {id === current.id ? "▶ " : ""}
            {state.actors[id]?.name}
            <small>{state.actors[id]?.health} HP</small>
          </span>
        ))}
      </div>
      {combat.phase === "aftermath" && (
        <div className="victory-loot">
          <strong>Đối thủ bị hạ. Bạn quyết định ai được sống.</strong>
          {victory?.type === "combat.victory" && (
            <p>
              Nhận <Costs resources={victory.rewards} /> · +{victory.xp}{" "}
              XP/người. Nhấp nhân vật trên map để dùng điểm nâng sau trận.
            </p>
          )}
          <p>
            Bắt giữ người gục ngã để giữ họ sống. Kết thúc ngay sẽ bỏ lại người
            chưa bắt.
          </p>
        </div>
      )}
      <div className="battlefield">
        <div className="team">
          <p className="eyebrow">
            ĐOÀN XE{" "}
            {selected?.target === "ally"
              ? "· CHỌN NGƯỜI NHẬN KỸ NĂNG"
              : "· HEALTH / NĂNG LƯỢNG"}
          </p>
          {allies.map((actor) => (
            <button
              key={`${actor.id}-${state.commandLog.length}`}
              className={`fighter ${current.id === actor.id ? "acting" : ""} ${selected?.target === "ally" && ally?.id === actor.id ? "selected" : ""} ${actor.status !== "active" ? "incapacitated" : ""} ${damageTo(actor.id) < 0 ? "hit-loss" : damageTo(actor.id) > 0 ? "hit-gain" : ""}`}
              onClick={() => setAllyTargetId(actor.id)}
              aria-label={`Chọn đồng đội ${actor.name}`}
            >
              <div className="fighter-heading">
                <AssetArt
                  id={`asset.${actor.id}`}
                  kind="portrait"
                  label={actor.name}
                  className="portrait"
                />
                <div>
                  <strong>{actor.name}</strong>
                  <small>
                    {actor.role} · {statusLabels[actor.status]}
                  </small>
                </div>
              </div>
              <Meter
                value={actor.health}
                max={actor.maxHealth}
                label="HP"
                danger={actor.health < actor.maxHealth / 3}
              />
              <span className="energy-pips">
                {Array.from(
                  { length: actor.attributes?.maxEnergy ?? 6 },
                  (_, i) => (
                    <i
                      key={i}
                      className={i < (actor.energy ?? 0) ? "filled" : ""}
                    />
                  ),
                )}
              </span>
              <small>
                {actor.energy}/{actor.attributes?.maxEnergy} NL{" "}
                {combat.defendedActorIds.includes(actor.id)
                  ? "· PHÒNG THỦ 50%"
                  : ""}
              </small>
              {damageTo(actor.id) !== 0 && (
                <span
                  className={`floating-delta ${damageTo(actor.id) > 0 ? "gain" : "loss"}`}
                >
                  {damageTo(actor.id) > 0 ? "+" : ""}
                  {damageTo(actor.id)} HP
                </span>
              )}
            </button>
          ))}
        </div>
        <span className="versus">VS</span>
        <div className="team">
          <p className="eyebrow">{enemyName} · CHẠM ĐỂ CHỌN MỤC TIÊU</p>
          {enemies.map((actor) => (
            <button
              key={`${actor.id}-${state.commandLog.length}`}
              className={`fighter target ${enemy?.id === actor.id ? "selected" : ""} ${actor.status !== "active" ? "incapacitated" : ""} ${damageTo(actor.id) < 0 ? "hit-loss" : damageTo(actor.id) > 0 ? "hit-gain" : ""}`}
              disabled={actor.status !== "active"}
              onClick={() => setEnemyTargetId(actor.id)}
              aria-label={`Chọn ${actor.name}`}
            >
              <div className="fighter-heading">
                <AssetArt
                  id={`asset.${actor.id}`}
                  kind="portrait"
                  label={actor.name}
                  className="portrait enemy"
                />
                <div>
                  <strong>{actor.name}</strong>
                  <small>
                    {actor.role} · {statusLabels[actor.status]}
                  </small>
                </div>
              </div>
              <Meter
                value={actor.health}
                max={actor.maxHealth}
                label="HP"
                danger
              />
              {enemy?.id === actor.id && actor.status === "active" && (
                <small className="target-selected">◎ ĐANG NHẮM</small>
              )}
              {damageTo(actor.id) !== 0 && (
                <span className="floating-delta loss">
                  {damageTo(actor.id)} HP
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      {combat.phase === "aftermath" ? (
        <div className="battle-actions">
          {enemies
            .filter((actor) => actor.status === "downed")
            .map((actor) => (
              <button
                className="button"
                key={actor.id}
                onClick={() => action("capture", actor.id)}
              >
                Bắt giữ {actor.name} · 1h
              </button>
            ))}
          <button className="button primary" onClick={() => action("finish")}>
            Kết thúc trận · Bỏ lại người chưa bắt
          </button>
        </div>
      ) : (
        <>
          <div className="battle-actions primary-actions">
            <button
              className="button primary"
              disabled={!enemy}
              onClick={() => action("attack", enemy?.id)}
            >
              Tấn công {enemy?.name} · {attack[0]}–{attack[1]} HP
            </button>
            <button className="button" onClick={() => action("defend")}>
              Phòng thủ · giảm 50% damage
            </button>
          </div>
          <div className="combat-skill-picker">
            <p className="eyebrow">
              KỸ NĂNG CỦA {current.name} · CHỌN ĐỂ XEM HIỆU QUẢ
            </p>
            <div>
              {(current.skillIds ?? []).map((id) => {
                const skill = definition.campaign?.skills.find(
                  (entry) => entry.id === id,
                );
                if (!skill || skill.target === "exploration") return null;
                const target =
                  skill.target === "ally"
                    ? ally?.id
                    : skill.target === "self"
                      ? current.id
                      : enemy?.id;
                const v = skillView(state, current.id, id, target, definition);
                return (
                  <button
                    className={`button skill-button ${selected?.id === id ? "chosen" : ""}`}
                    key={id}
                    disabled={!v.enabled}
                    title={v.reason || skill.description}
                    onClick={() => setSkillId(id)}
                  >
                    <AssetArt
                      id={skill.assetId ?? `asset.${skill.id}`}
                      kind="skill"
                      label={skill.name}
                      decorative
                    />
                    <strong>{skill.name}</strong>
                    <small>
                      {v.impact} · {skill.energyCost} NL
                      {v.cooldown ? ` · hồi ${v.cooldown}h` : ""}
                    </small>
                  </button>
                );
              })}
            </div>
            {selected && selectedView && (
              <div className="ability-preview">
                <div>
                  <strong>
                    {selected.name} → {state.actors[targetId ?? ""]?.name}
                  </strong>
                  <p>{selected.description}</p>
                  <b>{selectedView.impact}</b>
                  <small>
                    {selected.energyCost} năng lượng · hồi{" "}
                    {selected.cooldownTicks} giờ ·{" "}
                    <Costs resources={selectedView.costs ?? selected.costs} />
                  </small>
                </div>
                <button
                  className="button primary"
                  disabled={!selectedView.enabled}
                  onClick={() => {
                    dispatch({
                      type: "use-skill",
                      convoyId: state.player.convoyId,
                      actorId: current.id,
                      skillId: selected.id,
                      ...(targetId ? { targetId } : {}),
                    });
                    setSkillId(null);
                  }}
                >
                  Thi triển {selected.name}
                </button>
              </div>
            )}
          </div>
          <div className="battle-actions secondary-actions">
            {enemies
              .filter((actor) => actor.status === "downed")
              .map((actor) => (
                <button
                  className="button"
                  key={actor.id}
                  onClick={() => action("capture", actor.id)}
                >
                  Bắt giữ {actor.name}
                </button>
              ))}
            <button
              className="button"
              disabled={!peaceful}
              title={
                encounter
                  ? "Bọn cướp không chấp nhận đàm phán."
                  : "Cần manh mối hoặc Hà."
              }
              onClick={() => action("negotiate")}
            >
              Đàm phán
            </button>
            <button
              className="button"
              disabled={
                (state.convoys[state.player.convoyId]?.resources.fuel ?? 0) < 2
              }
              onClick={() => action("retreat")}
            >
              Rút lui · 2 fuel · 80%
            </button>
            <button
              className="button danger-button"
              onClick={() => action("surrender")}
            >
              Đầu hàng · mất kỳ vật
            </button>
          </div>
        </>
      )}
      <div className="combat-log" aria-live="polite">
        {combat.log.slice(-6).map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
      <p className="footnote muted">
        Mỗi lượt tiêu 1 giờ và khẩu phần. Enemy AI sẽ hành động khi hết lượt
        người trên xe. Đổi thế đánh/huấn luyện thực hiện ngoài trận.
      </p>
    </section>
  );
}

import { useState } from "react";
import type { GameCommand } from "../../core/commands";
import type { GameState } from "../../core/state-schema";
import { stanceBonus } from "../../expedition/progression";
import { skillView } from "../../read-models/skills";
import { useDefinition } from "../definition";
import { AssetArt } from "./AssetArt";
import { Costs, Meter, statusLabels } from "./shared";

export function CrewConsole({
  state,
  dispatch,
  compact = false,
}: {
  state: GameState;
  dispatch: (payload: GameCommand["payload"]) => void;
  compact?: boolean;
}) {
  const definition = useDefinition();
  const [selected, setSelected] = useState<string | null>(
    compact
      ? null
      : (state.player.convoyId &&
          state.convoys[state.player.convoyId]?.actorIds[0]) ||
          null,
  );
  const [healTarget, setHealTarget] = useState("");
  const convoy = state.convoys[state.player.convoyId];
  if (!convoy) return null;
  const actors = convoy.actorIds.map((id) => state.actors[id]!);
  const current = actors.find((actor) => actor.id === selected);
  const config = definition.campaign?.operations;
  return (
    <section
      className={`crew-console ${compact ? "compact" : "panel padded"}`}
      aria-label="Tình trạng nhân vật trên map"
    >
      <div className="crew-console-label">
        <span className="eyebrow">
          {compact
            ? "ĐOÀN XE · CHẠM NHÂN VẬT ĐỂ TÙY CHỈNH / DÙNG KỸ NĂNG"
            : "NHÂN VẬT · HUẤN LUYỆN · THẾ ĐÁNH"}
        </span>
        {config && (
          <small>Mỗi {config.progression.xpPerPoint} XP → +1 điểm nâng</small>
        )}
      </div>
      <div className="crew-strip">
        {actors.map((actor) => (
          <button
            className={`crew-tile ${selected === actor.id ? "selected" : ""} ${actor.status !== "active" ? "incapacitated" : ""}`}
            key={actor.id}
            onClick={() => setSelected(selected === actor.id ? null : actor.id)}
            aria-expanded={selected === actor.id}
            aria-label={`Tùy chỉnh ${actor.name}`}
          >
            <AssetArt
              id={`asset.${actor.id}`}
              kind="portrait"
              label={actor.name}
              className="portrait"
            />
            <span className="crew-tile-info">
              <span>
                <strong>{actor.name}</strong>
                <small>{statusLabels[actor.status]}</small>
              </span>
              <Meter label="HP" value={actor.health} max={actor.maxHealth} />
              <span className="crew-energy">
                NL {actor.energy ?? 0}/{actor.attributes?.maxEnergy ?? 0} · Công{" "}
                {(actor.attributes?.attack ?? 10) +
                  stanceBonus(actor, definition, "attack")}{" "}
                · Thủ{" "}
                {(actor.attributes?.defense ?? 2) +
                  stanceBonus(actor, definition, "defense")}
              </span>
            </span>
            {!!actor.progression?.points && (
              <span className="point-badge">+{actor.progression.points}</span>
            )}
          </button>
        ))}
      </div>
      {current && (
        <div className="actor-editor">
          <header>
            <div>
              <h3>
                {current.name} · {current.role}
              </h3>
              <p>
                {current.progression
                  ? `${current.progression.xp} XP · ${current.progression.points} điểm huấn luyện còn lại`
                  : "Hành trình v0.1: chưa có huấn luyện/stance"}
              </p>
            </div>
            <button
              className="text-button"
              aria-label="Đóng tùy chỉnh"
              onClick={() => setSelected(null)}
            >
              ×
            </button>
          </header>
          {config && current.progression && (
            <div className="customization-grid">
              <div>
                <p className="eyebrow">HUẤN LUYỆN · 0 GIỜ</p>
                <div className="upgrade-buttons">
                  {config.upgrades.map((upgrade) => (
                    <button
                      className="button"
                      key={upgrade.id}
                      disabled={
                        !!state.combat ||
                        state.status !== "active" ||
                        current.status !== "active" ||
                        !current.progression?.points
                      }
                      onClick={() =>
                        dispatch({
                          type: "train-actor",
                          convoyId: convoy.id,
                          actorId: current.id,
                          upgradeId: upgrade.id,
                        })
                      }
                    >
                      {upgrade.name} +{upgrade.amount}{" "}
                      {upgrade.attribute === "attack"
                        ? "công"
                        : upgrade.attribute === "maxHealth"
                          ? "HP tối đa"
                          : "NL tối đa"}
                      <small>1 điểm</small>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="eyebrow">THẾ ĐÁNH · 0 GIỜ</p>
                <div className="stance-buttons">
                  {config.stances.map((stance) => (
                    <button
                      className={`button ${stance.id === current.progression?.stanceId ? "chosen" : ""}`}
                      key={stance.id}
                      title={stance.description}
                      disabled={
                        !!state.combat ||
                        state.status !== "active" ||
                        current.status !== "active" ||
                        stance.id === current.progression?.stanceId
                      }
                      onClick={() =>
                        dispatch({
                          type: "set-stance",
                          convoyId: convoy.id,
                          actorId: current.id,
                          stanceId: stance.id,
                        })
                      }
                    >
                      {stance.name}
                      <small>
                        {stance.attack >= 0 ? "+" : ""}
                        {stance.attack} công / {stance.defense >= 0 ? "+" : ""}
                        {stance.defense} thủ
                      </small>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="skill-cards">
            {current.skillIds?.map((id) => {
              const skill = definition.campaign?.skills.find(
                (entry) => entry.id === id,
              );
              if (!skill) return null;
              const ally =
                actors.find((actor) => actor.id === healTarget) ?? current;
              const target = skill.target === "ally" ? ally.id : current.id;
              const view = skillView(state, current.id, id, target, definition);
              return (
                <article
                  key={id}
                  className={`skill-card skill-${skill.effect}`}
                >
                  <div>
                    <AssetArt
                      id={skill.assetId}
                      kind="skill"
                      label={skill.name}
                    />
                    <strong>{skill.name}</strong>
                    <span>
                      {skill.energyCost} NL · hồi {skill.cooldownTicks}h
                    </span>
                  </div>
                  <p>{skill.description}</p>
                  <b>
                    {skill.target === "enemy"
                      ? `Sát thương cơ bản +${skill.power} (chọn đối thủ trong combat)`
                      : view.impact}
                  </b>
                  {skill.target === "ally" && (
                    <select
                      aria-label={`Mục tiêu ${skill.name}`}
                      value={ally.id}
                      onChange={(event) => setHealTarget(event.target.value)}
                    >
                      {actors
                        .filter(
                          (actor) =>
                            actor.status !== "dead" &&
                            actor.status !== "captured",
                        )
                        .map((actor) => (
                          <option value={actor.id} key={actor.id}>
                            {actor.name} · {actor.health}/{actor.maxHealth} HP
                          </option>
                        ))}
                    </select>
                  )}
                  <button
                    className="button"
                    disabled={!view.enabled}
                    title={view.reason}
                    onClick={() =>
                      dispatch({
                        type: "use-skill",
                        convoyId: convoy.id,
                        actorId: current.id,
                        skillId: id,
                        targetId: target,
                      })
                    }
                  >
                    {view.enabled ? `Dùng ${skill.name} · 1 giờ` : view.reason}
                  </button>
                  {view.costs && (
                    <small>
                      Vật tư <Costs resources={view.costs} />
                    </small>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

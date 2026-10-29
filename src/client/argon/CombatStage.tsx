import { useState } from "react";
import type { CSSProperties } from "react";
import type { GameState } from "../../core/state-schema";
import type { GameCommand } from "../../core/commands";
import type { DomainEvent } from "../../core/events";
import { currentCombatActor } from "../../combat/engine";
import {
  abilityReason,
  attackReason,
  enemyIntent,
  isFrontline,
  tacticalDamageRange,
} from "../../combat/tactical-engine";
import { damageRange } from "../../combat/actions";
import { skillView } from "../../read-models/skills";
import type { TacticalAbility } from "../../combat/tactical-schema";
import { useDefinition } from "../definition";
import { resourceLabels } from "../components/shared";
import type { ResourceId } from "../../core/primitives";
import { AssetArt } from "../components/AssetArt";
import { Atmosphere } from "./Atmosphere";

const atlas: Record<string, number> = {
  "character.minh": 0,
  "character.bao": 1,
  "character.lan": 2,
  "character.hunger": 3,
  "character.watcher": 4,
};
const statusNames = {
  "armor-broken": "PHÁ GIÁP",
  bleed: "CHẢY MÁU",
  guard: "CHE CHẮN",
  reflect: "PHẢN CHIẾU",
};
type Beat = Extract<DomainEvent["payload"], { type: "battle.beat" }>;
export function CombatStage({
  state,
  decision,
  beat,
  busy,
  skip,
  dispatch,
}: {
  state: GameState;
  decision: GameState;
  beat: Beat | null;
  busy: boolean;
  skip: () => void;
  dispatch: (payload: GameCommand["payload"]) => void;
}) {
  const definition = useDefinition();
  const [enemyId, setEnemyId] = useState("");
  const [allyId, setAllyId] = useState("");
  const [selected, setSelected] = useState("");
  const [mode, setMode] = useState<"skills" | "move">("skills");
  const [atlasFailed, setAtlasFailed] = useState(false);
  const battle = decision.combat;
  const current = currentCombatActor(decision);
  if (!battle || !current) return null;
  const convoyId = decision.player.convoyId;
  const participants = battle.turnOrder
    .map((id) => decision.actors[id]!)
    .filter(Boolean);
  const enemies = participants.filter(
    (a) => a.convoyId === battle.enemyConvoyId,
  );
  const allies = participants.filter((a) => a.convoyId === convoyId);
  const enemy =
    enemies.find((a) => a.id === enemyId && a.status === "active") ??
    enemies.find((a) => a.status === "active");
  const ally =
    allies.find(
      (a) => a.id === allyId && a.status !== "captured" && a.status !== "dead",
    ) ??
    [...allies]
      .filter((a) => a.status !== "captured" && a.status !== "dead")
      .sort((a, b) => a.health / a.maxHealth - b.health / b.maxHealth)[0];
  const legacyAbilities: TacticalAbility[] = (definition.campaign?.skills ?? [])
    .filter(
      (s) =>
        current.skillIds?.includes(s.id) &&
        s.target !== "exploration" &&
        s.effect !== "reveal",
    )
    .map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      source: "actor",
      target: s.target === "exploration" ? "self" : s.target,
      reach: "any",
      effect: s.effect === "reveal" ? "guard" : s.effect,
      power: s.power,
      energyCost: s.energyCost,
      costs: s.costs,
      cooldownTurns: s.cooldownTicks,
    }));
  const abilities = (
    definition.campaign?.tactics?.abilities ?? legacyAbilities
  ).filter((a) => a.source !== "actor" || current.skillIds?.includes(a.id));
  const ability = abilities.find((a) => a.id === selected);
  const targetId =
    ability?.target === "ally"
      ? ally?.id
      : ability?.target === "self"
        ? current.id
        : enemy?.id;
  const reason = ability
    ? battle.tactics
      ? abilityReason(decision, current.id, ability, targetId)
      : skillView(decision, current.id, ability.id, targetId, definition).reason
    : battle.tactics
      ? attackReason(decision, current.id, enemy?.id)
      : !enemy
        ? "Chọn mục tiêu."
        : "";
  const range = enemy
    ? battle.tactics
      ? tacticalDamageRange(decision, current.id, enemy.id, definition, ability)
      : damageRange(
          decision,
          current.id,
          enemy.id,
          ability?.power ?? 0,
          definition,
        )
    : [0, 0];
  const send = (
    action: "attack" | "guard" | "ability" | "move",
    extra: Partial<
      Extract<GameCommand["payload"], { type: "battle-action" }>
    > = {},
  ) => {
    if (busy) return;
    if (battle.tactics)
      dispatch({
        type: "battle-action",
        convoyId,
        actorId: current.id,
        action,
        ...extra,
      });
    else if (action === "ability" && extra.abilityId)
      dispatch({
        type: "use-skill",
        convoyId,
        actorId: current.id,
        skillId: extra.abilityId,
        ...(extra.targetId ? { targetId: extra.targetId } : {}),
      });
    else
      dispatch({
        type: "combat",
        convoyId,
        actorId: current.id,
        action: action === "guard" ? "defend" : "attack",
        ...(enemy ? { targetId: enemy.id } : {}),
      });
    setSelected("");
    setMode("skills");
  };
  const combat = (
    action: "capture" | "finish" | "retreat" | "surrender" | "negotiate",
    id?: string,
  ) => {
    if (!busy)
      dispatch({
        type: "combat",
        convoyId,
        actorId: current.id,
        action,
        ...(id ? { targetId: id } : {}),
      });
  };
  const visualBattle = state.combat ?? battle;
  const visualCurrent = currentCombatActor(state) ?? current;
  return (
    <section
      className={`battle-screen ${beat ? `effect-${beat.effect}` : ""}`}
      aria-label="Chiến trường"
    >
      <img
        hidden
        src="/art/argon/market-actors-atlas.png"
        alt=""
        onError={() => setAtlasFailed(true)}
      />
      <div
        className="battle-canvas"
        style={{
          backgroundImage:
            "url('/art/argon/market-stage.jpg'),url('/art/a2/location.market.jpg')",
        }}
      >
        <Atmosphere
          intense={Boolean(
            beat && (beat.effect === "damage" || beat.effect === "reflect"),
          )}
        />
        <div className="battle-vignette" />
        <div className="battle-topline">
          <span className="kicker">
            ĐỤNG ĐỘ /{" "}
            {definition.campaign?.encounters?.find(
              (e) => e.convoyId === battle.enemyConvoyId,
            )?.name ?? "ĐOÀN XE TRO TÀN"}
          </span>
          <span className="round-label">
            VÒNG {visualBattle.round.toString().padStart(2, "0")}
          </span>
        </div>
        <div className="turn-ribbon" aria-label="Thứ tự lượt">
          {visualBattle.turnOrder.map((id) => {
            const a = state.actors[id]!;
            return (
              <div
                key={id}
                className={`turn-tile ${a.convoyId !== convoyId ? "hostile" : ""} ${id === visualCurrent.id ? "now" : ""} ${a.status !== "active" ? "fallen" : ""}`}
                title={`${a.name} · ${a.health} HP`}
              >
                <AssetArt id={`asset.${id}`} kind="portrait" label={a.name} />
                <span>{a.name}</span>
              </div>
            );
          })}
        </div>
        <div className="battle-objective">
          <span className="objective-mark">◇</span>
          <div>
            <small>MỤC TIÊU</small>
            <strong>
              {battle.phase === "aftermath"
                ? "Giữ mạng người. Mang vật tư về xe."
                : "Phá vỡ đội hình · Bảo toàn đoàn xe"}
            </strong>
          </div>
        </div>
        <div className="battle-actors">
          {participants.map((logical, i) => {
            const actor = state.actors[logical.id] ?? logical;
            const friendly = logical.convoyId === convoyId;
            const slot =
              state.combat?.tactics?.positions[actor.id] ??
              (friendly ? allies : enemies).findIndex((a) => a.id === actor.id);
            const x = friendly
              ? [40, 31, 21, 12][slot]
              : [60, 69, 79, 88][slot];
            const acting = beat?.actorId === actor.id;
            const receiving = beat?.targetId === actor.id;
            const statuses =
              decision.combat?.tactics?.statuses.filter(
                (s) => s.actorId === actor.id,
              ) ?? [];
            const intent = !friendly ? enemyIntent(decision, actor.id) : null;
            const col = atlas[actor.id];
            return (
              <button
                key={actor.id}
                className={`combatant ${friendly ? "friendly" : "enemy"} ${actor.id === enemy?.id || (actor.id === ally?.id && ability?.target === "ally") ? "targeted" : ""} ${logical.id === visualCurrent.id ? "active-actor" : ""} ${actor.status !== "active" ? "downed" : ""} ${acting ? "striking" : ""} ${receiving ? `receiving-${beat?.effect}` : ""}`}
                style={
                  {
                    left: `${x}%`,
                    bottom: `${8 + (slot % 2) * 5}%`,
                    zIndex: 10 - slot,
                    "--actor-index": i,
                    "--slot": slot,
                  } as CSSProperties
                }
                onClick={() =>
                  friendly ? setAllyId(actor.id) : setEnemyId(actor.id)
                }
                aria-label={`Chọn ${friendly ? "đồng đội" : "mục tiêu"} ${actor.name}`}
                disabled={busy || (!friendly && logical.status !== "active")}
              >
                <div className="actor-label">
                  <strong>{actor.name}</strong>
                  <span>
                    {battle.tactics
                      ? isFrontline(decision, actor.id)
                        ? "TUYẾN ĐẦU"
                        : "HÀNG SAU"
                      : actor.role}
                  </span>
                  <div className="health-bar">
                    <i
                      className="health-ghost"
                      style={{
                        width: `${(actor.health / actor.maxHealth) * 100}%`,
                      }}
                    />
                    <i
                      style={{
                        width: `${(actor.health / actor.maxHealth) * 100}%`,
                      }}
                    />
                  </div>
                  <small>
                    {actor.health}/{actor.maxHealth} HP{" "}
                    <em>{actor.energy ?? 0} NL</em>
                  </small>
                </div>
                {col !== undefined && !atlasFailed ? (
                  <span
                    className={`sprite-atlas ${friendly ? "" : "mirrored"}`}
                    style={{
                      backgroundPosition: `${col * 25}% ${acting ? 100 : 0}%`,
                    }}
                  />
                ) : (
                  <span className="combatant-portrait">
                    <AssetArt
                      id={`asset.${actor.id}`}
                      kind="portrait"
                      label={actor.name}
                    />
                  </span>
                )}
                <span className="actor-shadow" />
                <span className="status-row">
                  {statuses.map((s) => (
                    <span
                      key={s.kind}
                      className={`status-token status-${s.kind}`}
                      title={`${statusNames[s.kind]} · ${s.remainingTurns} lượt`}
                    >
                      {statusNames[s.kind]} {s.remainingTurns}
                    </span>
                  ))}
                </span>
                {intent && (
                  <span className="intent-tag">
                    ↘{" "}
                    {intent.vehicle
                      ? "XE KHÁCH"
                      : decision.actors[intent.targetId]?.name}
                  </span>
                )}
                {receiving && beat && (
                  <span
                    key={`${decision.commandLog.length}-${beat.actorId}-${beat.effect}-${beat.amount}`}
                    className={`impact-number ${beat.effect}`}
                  >
                    {beat.effect === "status" && beat.status
                      ? statusNames[beat.status]
                      : beat.effect === "move"
                        ? "ĐỔI VỊ TRÍ"
                        : beat.amount > 0
                          ? `${beat.effect === "heal" || beat.effect === "repair" ? "+" : "−"}${beat.amount}`
                          : ""}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="vehicle-overlay">
          <span>XE KHÁCH SỐ 07</span>
          <strong>{state.convoys[convoyId]?.vehicle.condition}%</strong>
          <div className="health-bar vehicle">
            <i
              style={{
                width: `${state.convoys[convoyId]?.vehicle.condition}%`,
              }}
            />
          </div>
        </div>
        {busy && (
          <button className="skip-animation" onClick={skip}>
            Bỏ qua hoạt ảnh ⏭
          </button>
        )}
      </div>
      <div className="combat-console">
        <div className="active-portrait">
          <AssetArt
            id={`asset.${current.id}`}
            kind="portrait"
            label={current.name}
          />
          <div>
            <small>{busy ? "ĐANG DIỄN RA" : "LƯỢT CỦA BẠN"}</small>
            <h2>{current.name}</h2>
            <span>
              {current.energy ?? 0} / {current.attributes?.maxEnergy ?? 6} NĂNG
              LƯỢNG
            </span>
          </div>
        </div>
        {battle.phase === "aftermath" ? (
          <div className="aftermath">
            <h2>Chiến thắng. Cái giá còn ở lại.</h2>
            <p>
              Chiến lợi phẩm đã vào kho. Người gục bị bỏ lại khi kết thúc sẽ
              chết.
            </p>
            <div className="inline-actions">
              {enemies
                .filter((a) => a.status === "downed")
                .map((a) => (
                  <button
                    key={a.id}
                    disabled={busy}
                    onClick={() => combat("capture", a.id)}
                  >
                    Bắt giữ {a.name}
                  </button>
                ))}
              <button
                className="primary"
                disabled={busy}
                onClick={() => combat("finish")}
              >
                Trở về hành trình ↗
              </button>
            </div>
          </div>
        ) : (
          <div className="skill-console">
            <div className="console-tabs">
              <button
                className={mode === "skills" ? "selected" : ""}
                onClick={() => setMode("skills")}
              >
                KỸ NĂNG
              </button>
              {battle.tactics && (
                <button
                  className={mode === "move" ? "selected" : ""}
                  onClick={() => setMode("move")}
                >
                  ĐỘI HÌNH
                </button>
              )}
              <span>
                {busy
                  ? "ĐANG GIẢI QUYẾT"
                  : `MỤC TIÊU: ${ability?.target === "ally" ? ally?.name : (enemy?.name ?? "—")}`}
              </span>
            </div>
            <div
              className={`target-picker ${ability?.target === "ally" ? "choose-ally" : ""}`}
              aria-label="Danh sách mục tiêu"
            >
              {(ability?.target === "ally" ? allies : enemies).map((a) => (
                <button
                  key={a.id}
                  disabled={
                    busy ||
                    a.status === "dead" ||
                    a.status === "captured" ||
                    (ability?.target !== "ally" && a.status !== "active")
                  }
                  className={
                    a.id === (ability?.target === "ally" ? ally?.id : enemy?.id)
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    ability?.target === "ally"
                      ? setAllyId(a.id)
                      : setEnemyId(a.id)
                  }
                >
                  {a.name}
                  <small>
                    {a.health}/{a.maxHealth} HP
                  </small>
                </button>
              ))}
            </div>
            {mode === "move" ? (
              <div className="ability-row">
                {[0, 1, 2, 3].map((slot) => (
                  <button
                    disabled={
                      busy || battle.tactics?.positions[current.id] === slot
                    }
                    key={slot}
                    onClick={() => send("move", { slot })}
                  >
                    Vị trí {slot + 1}
                    <small>
                      {slot < 2 ? "Hàng trước" : "Hàng sau"} · tiêu lượt
                    </small>
                  </button>
                ))}
              </div>
            ) : (
              <div className="ability-row">
                <button
                  className={!selected ? "chosen" : ""}
                  onClick={() => setSelected("")}
                >
                  <span className="ability-glyph">⚔</span>
                  <strong>Đánh thường</strong>
                  <small>Tuyến đầu · 0 NL</small>
                </button>
                {abilities.map((a, i) => (
                  <button
                    key={a.id}
                    className={selected === a.id ? "chosen" : ""}
                    disabled={busy}
                    onClick={() => setSelected(a.id)}
                  >
                    <span className={`ability-glyph glyph-${a.effect}`}>
                      {["◇", "✦", "✚", "⬡", "⌁", "⚙", "☼", "◈"][i % 8]}
                    </span>
                    <strong>{a.name}</strong>
                    <small>
                      {a.source === "vehicle"
                        ? "XE HỖ TRỢ"
                        : a.source === "artifact"
                          ? "KỲ VẬT"
                          : `${a.energyCost} NL`}
                    </small>
                  </button>
                ))}
                <button disabled={busy} onClick={() => send("guard")}>
                  <span className="ability-glyph">⬡</span>
                  <strong>Phòng thủ</strong>
                  <small>Giảm 50% sát thương</small>
                </button>
              </div>
            )}
            {mode === "skills" && (
              <div className="ability-description">
                <div>
                  <strong>{ability?.name ?? "Tấn công cận chiến"}</strong>
                  <p>
                    {ability?.description ??
                      "Đánh mục tiêu tuyến đầu. Có thể đổi đội hình để đưa đồng đội lên trước."}
                  </p>
                  <small>
                    {reason ||
                      (ability?.effect === "damage" || !ability
                        ? `${range[0]}–${range[1]} sát thương dự kiến`
                        : "Tiêu một lượt hành động")}
                    {ability &&
                      Object.entries(ability.costs)
                        .filter(([, n]) => n > 0)
                        .map(
                          ([key, n]) =>
                            ` · ${n} ${resourceLabels[key as ResourceId]}`,
                        )}
                  </small>
                </div>
                <button
                  className="primary execute"
                  disabled={busy || Boolean(reason)}
                  onClick={() =>
                    send(ability ? "ability" : "attack", {
                      ...(targetId ? { targetId } : {}),
                      ...(ability ? { abilityId: ability.id } : {}),
                    })
                  }
                >
                  {busy ? "Đang diễn ra…" : "THỰC HIỆN ↗"}
                </button>
              </div>
            )}
          </div>
        )}
        <div className="combat-record">
          <small>NHẬT KÝ GIAO CHIẾN</small>
          {decision.combat?.log.slice(-3).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
          {battle.phase === "active" && (
            <div className="inline-actions">
              <button disabled={busy} onClick={() => combat("retreat")}>
                Rút lui · 2 xăng
              </button>
              <button disabled={busy} onClick={() => combat("surrender")}>
                Đầu hàng
              </button>
              {!definition.campaign?.encounters?.some(
                (e) => e.convoyId === battle.enemyConvoyId,
              ) && (
                <button disabled={busy} onClick={() => combat("negotiate")}>
                  Đàm phán
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

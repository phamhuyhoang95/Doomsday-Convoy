import { useState } from "react";
import type { GameState } from "../../core/state-schema";
import type { GameCommand } from "../../core/commands";
import { ascensionPreview } from "../../occult/progression";
import { useDefinition } from "../definition";
import { AssetArt } from "../components/AssetArt";
import { Costs } from "../components/shared";
export function PathwaysScreen({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: (p: GameCommand["payload"]) => void;
}) {
  const definition = useDefinition();
  const config = definition.campaign?.resonance;
  const convoy = state.convoys[state.player.convoyId]!;
  const [actorId, setActorId] = useState(convoy.actorIds[0]!);
  const [selected, setSelected] = useState("");
  const actor = state.actors[actorId] ?? state.actors[convoy.actorIds[0]!]!;
  const path =
    config?.pathways.find(
      (p) => p.id === (actor.pathway?.pathwayId ?? selected),
    ) ?? config?.pathways[0];
  if (!config || !path) return null;
  const preview = ascensionPreview(state, actor.id, path.id, definition);
  return (
    <main className="occult-workspace">
      <header className="occult-heading">
        <div>
          <span className="kicker">GIỮ MỘT QUY TẮC TRONG CƠ THỂ</span>
          <h1>Con đường siêu phàm</h1>
          <p>
            Trải nghiệm tạo năng lực giữ di vật. Hồ sơ xác minh giúp bạn tiến
            sâu hơn.
          </p>
        </div>
        <div className="remnant-counter">
          <strong>{state.campaign?.occultRemnants ?? 0}</strong>
          <small>
            DI VẬT CỘNG HƯỞNG
            <br />
            Dự trữ chung của đoàn
          </small>
        </div>
      </header>
      <div className="pathway-crew">
        {convoy.actorIds.map((id) => {
          const a = state.actors[id]!;
          return (
            <button
              key={id}
              className={id === actor.id ? "selected" : ""}
              onClick={() => {
                setActorId(id);
                setSelected("");
              }}
            >
              <AssetArt id={`asset.${id}`} kind="portrait" label={a.name} />
              <span>
                <strong>{a.name}</strong>
                <small>
                  {a.pathway
                    ? `${config.pathways.find((p) => p.id === a.pathway?.pathwayId)?.name} · Bậc ${a.pathway.tier}`
                    : "Chưa thức tỉnh"}
                </small>
              </span>
            </button>
          );
        })}
      </div>
      <div className="pathway-grid">
        {config.pathways.map((p, i) => (
          <button
            key={p.id}
            className={`pathway-card ${p.id === path.id ? "selected" : ""}`}
            onClick={() => setSelected(p.id)}
            disabled={Boolean(
              actor.pathway && actor.pathway.pathwayId !== p.id,
            )}
          >
            <span className="occult-sigil">{["♰", "◉", "⚙", "◇"][i]}</span>
            <h2>{p.name}</h2>
            <p>{p.axiom}</p>
          </button>
        ))}
      </div>
      <section className="pathway-detail metal-panel">
        <header>
          <div>
            <span className="kicker">
              {actor.name} / {path.name}
            </span>
            <h2>{path.axiom}</h2>
            <p>{path.description}</p>
          </div>
          <strong>
            {preview.availableXp} XP khả dụng
            <small> / {actor.progression?.xp ?? 0} XP tích lũy</small>
          </strong>
        </header>
        <div className="pathway-tiers">
          {path.tiers.map((tier) => {
            const ability = definition.campaign?.tactics?.abilities.find(
              (a) => a.id === tier.skillId,
            )!;
            const acquired =
              actor.pathway?.pathwayId === path.id &&
              actor.pathway.tier <= tier.tier;
            const next = preview.tier?.tier === tier.tier;
            return (
              <article
                key={tier.tier}
                className={acquired ? "acquired" : next ? "next" : ""}
              >
                <small>
                  BẬC {tier.tier} / {tier.name}
                </small>
                <h3>{ability.name}</h3>
                <p>{ability.description}</p>
                {tier.riskReductionBps && (
                  <p className="pathway-passive">
                    Trên đường: giảm {tier.riskReductionBps / 100}% rủi ro còn
                    lại. Không cộng dồn giữa nhiều người.
                  </p>
                )}
                <div className="ritual-cost">
                  {tier.xpCost} XP · {tier.remnantCost} di vật{" "}
                  <Costs resources={tier.costs} />
                </div>
                <button
                  className={next ? "primary" : ""}
                  disabled={!next || !preview.enabled || acquired}
                  title={next ? preview.reason : "Cần hoàn tất bậc trước"}
                  onClick={() =>
                    dispatch({
                      type: "ascend-pathway",
                      convoyId: convoy.id,
                      actorId: actor.id,
                      pathwayId: path.id,
                    })
                  }
                >
                  {acquired
                    ? "ĐÃ GẮN KẾT"
                    : next
                      ? tier.tier === 9
                        ? "THỨC TỈNH ↗"
                        : "THĂNG BẬC ↗"
                      : "BẬC KẾ TIẾP"}
                </button>
                {next && !preview.enabled && (
                  <small className="ritual-reason">{preview.reason}</small>
                )}
              </article>
            );
          })}
        </div>
        <p className="ritual-note">
          Nghi thức tiêu XP khả dụng, di vật và vật tư đã ghi. Không tiêu giờ
          hành trình. Chọn một con đường cho mỗi người; chuyển ngạch/lai ngạch
          chưa mở.
        </p>
      </section>
    </main>
  );
}

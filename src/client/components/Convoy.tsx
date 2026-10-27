import { campaignDefinition as definition } from "../../content/campaign";
import type { GameCommand } from "../../core/commands";
import type { GameState } from "../../core/state-schema";
import { evaluateCondition } from "../../narrative/conditions";
import { Meter, resourceLabels, resourceSymbols, statusLabels } from "./shared";
import { RESOURCE_IDS } from "../../core/primitives";
import { AssetArt } from "./AssetArt";

export function Convoy({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: (payload: GameCommand["payload"]) => void;
}) {
  const convoy = state.convoys[state.player.convoyId];
  if (!convoy) return null;
  return (
    <section className="panel padded">
      <p className="eyebrow">KHÔNG AI SỐNG SÓT MỘT MÌNH</p>
      <h2>Những người trên xe</h2>
      <div className="crew-grid">
        {convoy.actorIds.map((id) => {
          const actor = state.actors[id];
          if (!actor) return null;
          return (
            <article className="crew-card" key={id}>
              <div className="fighter-heading">
                <AssetArt
                  id={`asset.${actor.id}`}
                  kind="portrait"
                  label={actor.name}
                  className="portrait large"
                />
                <div>
                  <h3>{actor.name}</h3>
                  <p>
                    {actor.role} · {statusLabels[actor.status]}
                  </p>
                </div>
              </div>
              <Meter
                label="Sức khỏe"
                value={actor.health}
                max={actor.maxHealth}
              />
              <Meter
                label="Năng lượng"
                value={actor.energy ?? 0}
                max={actor.attributes?.maxEnergy ?? 6}
              />
              <p className="muted">
                Công {actor.attributes?.attack ?? 10} · Thủ{" "}
                {actor.attributes?.defense ?? 2}
              </p>
              <div className="skill-list">
                {actor.skillIds?.map((skillId) => {
                  const skill = definition.campaign?.skills.find(
                    (entry) => entry.id === skillId,
                  );
                  if (!skill) return null;
                  const canUse =
                    !state.combat &&
                    state.status === "active" &&
                    actor.status === "active" &&
                    skill.target === "exploration" &&
                    (actor.energy ?? 0) >= skill.energyCost &&
                    (actor.cooldowns?.[skillId] ?? 0) <= state.world.tick + 1 &&
                    evaluateCondition(state, skill.requirements);
                  return (
                    <div key={skillId}>
                      <strong>{skill.name}</strong>
                      <p>{skill.description}</p>
                      {skill.target === "exploration" && (
                        <button
                          className="button"
                          disabled={!canUse}
                          onClick={() =>
                            dispatch({
                              type: "use-skill",
                              convoyId: convoy.id,
                              actorId: actor.id,
                              skillId,
                            })
                          }
                        >
                          Sử dụng · {skill.energyCost} năng lượng
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function Inventory({ state }: { state: GameState }) {
  const convoy = state.convoys[state.player.convoyId];
  if (!convoy) return null;
  const owned = Object.values(state.inventory.artifactInstances).filter(
    (artifact) => artifact.ownerId === convoy.id,
  );
  return (
    <section className="panel padded">
      <p className="eyebrow">THỨ BẠN MANG THEO</p>
      <h2>Kho của đoàn</h2>
      <div className="inventory-resources">
        {RESOURCE_IDS.map((id) => (
          <div key={id}>
            <span>{resourceSymbols[id]}</span>
            <strong>{convoy.resources[id]}</strong>
            <p>{resourceLabels[id]}</p>
          </div>
        ))}
      </div>
      <h3>Kỳ vật · {owned.length}</h3>
      {owned.length === 0 ? (
        <p className="muted">
          Chưa sở hữu kỳ vật. Mỗi kỳ vật chỉ tồn tại một instance; giao cho đối
          thủ sẽ mất quyền sử dụng.
        </p>
      ) : (
        <div className="artifact-grid">
          {owned.map((instance) => {
            const artifact = definition.campaign?.artifacts.find(
              (entry) => entry.id === instance.artifactId,
            );
            if (!artifact) return null;
            return (
              <article className="artifact-card" key={instance.id}>
                <AssetArt
                  id={artifact.assetId}
                  kind="artifact"
                  label={artifact.name}
                  className="relic-icon"
                />
                <div>
                  <h3>{artifact.name}</h3>
                  <p>{artifact.description}</p>
                  <small>
                    +{artifact.attackBonus} Công · +{artifact.defenseBonus} Thủ
                    cho đoàn
                  </small>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <div className="vehicle-card">
        <AssetArt
          id={`asset.${convoy.vehicle.id}`}
          kind="vehicle"
          label={convoy.vehicle.name}
          className="vehicle-symbol"
        />
        <div>
          <h3>{convoy.vehicle.name}</h3>
          <p>Xe mang cả đoàn, tài nguyên và kỳ vật qua mọi tuyến đường.</p>
          <Meter
            label="Tình trạng"
            value={convoy.vehicle.condition}
            max={convoy.vehicle.maxCondition}
          />
        </div>
      </div>
    </section>
  );
}

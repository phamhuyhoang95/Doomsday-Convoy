import { campaignDefinition as definition } from "../../content/campaign";
import type { GameState } from "../../core/state-schema";
import { eventEligibility } from "../../narrative/director";
import { statusLabels } from "./shared";

export function Journal({ state }: { state: GameState }) {
  const texts = definition.campaign?.texts ?? {};
  return (
    <div className="journal-grid">
      <section className="panel padded">
        <p className="eyebrow">STORY CONTRACTS</p>
        <h2>Những việc phải làm</h2>
        {state.activeQuests.map((quest) => {
          const template = definition.campaign?.quests.find(
            (entry) => entry.id === quest.templateId,
          );
          if (!template) return null;
          return (
            <article
              className={`quest ${quest.status !== "active" ? "resolved" : ""}`}
              key={quest.id}
            >
              <div>
                <h3>{texts[template.titleKey]}</h3>
                <span className="badge">{statusLabels[quest.status]}</span>
              </div>
              <p>{texts[template.descriptionKey]}</p>
              {quest.objectives.map((objective) => (
                <p className="objective" key={objective.id}>
                  {objective.complete || quest.status === "alternative"
                    ? "✓"
                    : "○"}{" "}
                  {
                    texts[
                      template.objectives.find(
                        (entry) => entry.id === objective.id,
                      )?.textKey ?? ""
                    ]
                  }
                </p>
              ))}
            </article>
          );
        })}
      </section>
      <section className="panel padded">
        <p className="eyebrow">ĐIỀU ĐÃ KHÁM PHÁ</p>
        <h2>Sổ tay người sống</h2>
        {state.knowledge.factIds.length === 0 && (
          <p className="muted">
            Chưa tìm thấy manh mối. Những sự thật chưa khám phá chưa xuất hiện
            trong sổ tay.
          </p>
        )}
        {state.knowledge.factIds.map((id) => (
          <p className="knowledge" key={id}>
            <span>◇</span>
            {definition.campaign?.facts.find((fact) => fact.id === id)
              ?.description ?? "Đoàn đã tới nơi trú."}
          </p>
        ))}
      </section>
    </div>
  );
}

export function DebugPanel({ state }: { state: GameState }) {
  const eligibility = eventEligibility(state, definition);
  return (
    <section className="panel padded debug-panel">
      <p className="eyebrow">CHẨN ĐOÁN PHÁT TRIỂN</p>
      <h2>World & command inspector</h2>
      <p>
        Seed {state.initialSeed} · RNG draws {state.rng.draws} · Tick{" "}
        {state.world.tick} · {state.commandLog.length} commands ·{" "}
        {state.eventSequence} domain events
      </p>
      <details>
        <summary>Event eligibility</summary>
        <pre>
          {JSON.stringify(
            eligibility.map(({ event, ...checks }) => ({
              id: event.id,
              ...checks,
            })),
            null,
            2,
          )}
        </pre>
      </details>
      <details>
        <summary>
          Story contracts & world facts (bao gồm điều người chơi chưa biết)
        </summary>
        <pre>
          {JSON.stringify(
            {
              quests: state.activeQuests,
              facts: state.world.facts,
              npc: state.world.npcs,
            },
            null,
            2,
          )}
        </pre>
      </details>
      <details>
        <summary>10 accepted commands gần nhất</summary>
        <pre>{JSON.stringify(state.commandLog.slice(-10), null, 2)}</pre>
      </details>
    </section>
  );
}

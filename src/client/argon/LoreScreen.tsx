import type { GameState } from "../../core/state-schema";
import { chapterProgress, discoveredRecords } from "../../read-models/campaign";
import { useDefinition } from "../definition";
import { Journal } from "../components/Journal";
export function LoreScreen({ state }: { state: GameState }) {
  const definition = useDefinition();
  const chapters = chapterProgress(state, definition);
  const records = discoveredRecords(state, definition);
  return (
    <main className="lore-workspace">
      <header className="occult-heading">
        <div>
          <span className="kicker">HÀNH TRÌNH / BẰNG CHỨNG / CÂU HỎI</span>
          <h1>Hồi Chuông Số Không</h1>
          <p>
            Những hồ sơ bạn tìm thấy, cùng những điều chúng chưa thể giải thích.
          </p>
        </div>
        <strong>
          {records.filter((r) => r.known).length} / {records.length} hồ sơ
        </strong>
      </header>
      <div className="chapter-grid">
        {chapters.map((ch) => (
          <article
            key={ch.id}
            className={`metal-panel ${ch.current ? "current" : ""}`}
          >
            <small>{ch.current ? "CHƯƠNG ĐANG ĐI" : "CHẶNG HÀNH TRÌNH"}</small>
            <h2>{ch.title}</h2>
            <strong>{ch.question}</strong>
            <p>{ch.summary}</p>
            <ul>
              {ch.objectives.map((o) => (
                <li key={o.referenceId} className={o.done ? "done" : ""}>
                  {o.done ? "◆" : "◇"} {o.label}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <section className="lore-records" aria-label="Hồ sơ đã khám phá">
        {records.map((r, i) =>
          r.known ? (
            <article key={r.record.id} className="metal-panel">
              <small>
                {r.record.source} /{" "}
                {r.record.confidence === "observed"
                  ? "ĐỐI CHIẾU ĐƯỢC"
                  : r.record.confidence === "testimony"
                    ? "LỜI CHỨNG"
                    : "GIẢ THUYẾT"}
              </small>
              <h2>{r.record.title}</h2>
              <p>{r.record.body}</p>
            </article>
          ) : (
            <article key={`locked-${i}`} className="metal-panel locked-record">
              <small>
                HỒ SƠ {String(i + 1).padStart(2, "0")} / CHƯA PHÁT HIỆN
              </small>
              <h2>Một khoảng trống trong bản ghi.</h2>
              <p>
                Điều tra địa điểm, kiểm chứng dấu vết và mang bằng chứng về đoàn
                xe.
              </p>
            </article>
          ),
        )}
      </section>
      <details className="legacy-journal metal-panel">
        <summary>Nhiệm vụ, manh mối và nhật ký hành động</summary>
        <Journal state={state} />
      </details>
    </main>
  );
}

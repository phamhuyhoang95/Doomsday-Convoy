import { useState } from "react";
import type { ActionReport } from "../../read-models/transition";
import { RESOURCE_IDS } from "../../core/primitives";
import { resourceLabels } from "./shared";

export function ActionReportPanel({
  report,
  close,
}: {
  report: ActionReport;
  close: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const crew = report.crew.filter(
    (entry) =>
      entry.joined || entry.health || entry.energy || entry.xp || entry.points,
  );
  return (
    <section
      className={`action-report ${report.victory ? "victory" : report.danger ? "danger-report" : ""}`}
      role="status"
      aria-label="Kết quả hành động"
    >
      <header>
        <strong>{report.victory ? "★ CHIẾN THẮNG" : report.title}</strong>
        <button aria-label="Đóng kết quả" onClick={close}>
          ×
        </button>
      </header>
      <div className="report-deltas">
        {RESOURCE_IDS.filter((id) => report.net[id] !== 0).map((id) => (
          <span
            key={id}
            className={report.net[id] > 0 ? "gain" : "spent"}
            title={resourceLabels[id]}
          >
            {resourceLabels[id]} {report.net[id] > 0 ? "+" : ""}
            {report.net[id]}
          </span>
        ))}
        {report.vehicle !== 0 && (
          <span className={report.vehicle > 0 ? "gain" : "loss"}>
            Xe {report.vehicle > 0 ? "+" : ""}
            {report.vehicle}
          </span>
        )}
        {report.ticks > 0 && <span>+{report.ticks} giờ</span>}
      </div>
      {report.victory && (
        <p className="report-gross">
          Loot:{" "}
          {RESOURCE_IDS.filter((id) => report.gains[id])
            .map((id) => `+${report.gains[id]} ${resourceLabels[id]}`)
            .join(" · ")}
          . Số trên là thay đổi ròng sau khẩu phần lượt này.
        </p>
      )}
      {crew.map((entry) => (
        <p className="report-crew" key={entry.id}>
          <b>{entry.name}</b>
          {entry.joined ? " gia nhập đoàn" : ""}
          {entry.health ? (
            <span className={entry.health > 0 ? "gain" : "loss"}>
              {" "}
              {entry.health > 0 ? "+" : ""}
              {entry.health} HP
            </span>
          ) : (
            ""
          )}
          {entry.energy ? (
            <span>
              {" "}
              {entry.energy > 0 ? "+" : ""}
              {entry.energy} NL
            </span>
          ) : (
            ""
          )}
          {entry.xp > 0 && <span className="gain"> +{entry.xp} XP</span>}
          {entry.points > 0 && (
            <span className="gain"> +{entry.points} điểm nâng</span>
          )}
        </p>
      ))}
      <p className="report-narrative">
        {report.combat.at(-1) ?? report.narrative}
      </p>
      {report.changes.map((change, i) => (
        <p className="report-change" key={i}>
          ◆ {change}
        </p>
      ))}
      <button
        className="text-button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        {expanded ? "Thu gọn" : "Xem chi phí, loot và hậu quả"}
      </button>
      {expanded && (
        <div className="report-detail">
          <p>{report.narrative}</p>
          <p>
            <b>Tiêu / mất:</b>{" "}
            {RESOURCE_IDS.filter((id) => report.costs[id])
              .map((id) => `${report.costs[id]} ${resourceLabels[id]}`)
              .join(" · ") || "Không"}
          </p>
          <p>
            <b>Nhận:</b>{" "}
            {RESOURCE_IDS.filter((id) => report.gains[id])
              .map((id) => `${report.gains[id]} ${resourceLabels[id]}`)
              .join(" · ") || "Không có vật tư mới"}
          </p>
          {[...report.discoveries, ...report.combat].map((text, i) => (
            <p key={i}>• {text}</p>
          ))}
        </div>
      )}
    </section>
  );
}

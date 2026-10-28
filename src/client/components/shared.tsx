import type { Resources } from "../../core/primitives";
import { RESOURCE_IDS } from "../../core/primitives";

export const resourceLabels = {
  food: "Lương thực",
  water: "Nước",
  fuel: "Nhiên liệu",
  medicine: "Thuốc",
  scrap: "Phế liệu",
};
export const resourceSymbols = {
  food: "◒",
  water: "◈",
  fuel: "▰",
  medicine: "+",
  scrap: "⚙",
};
export const statusLabels = {
  active: "Sẵn sàng",
  downed: "Gục ngã",
  dead: "Đã mất",
  captured: "Bị bắt",
  succeeded: "Hoàn tất",
  alternative: "Giải pháp thay thế",
  failed: "Thất bại",
};

export function Costs({ resources }: { resources: Resources }) {
  return (
    <span className="costs">
      {RESOURCE_IDS.filter((id) => resources[id] > 0).map((id) => (
        <span key={id} title={resourceLabels[id]}>
          {resources[id]} {resourceLabels[id].toLocaleLowerCase("vi")}
        </span>
      ))}
    </span>
  );
}
export function Meter({
  value,
  max,
  label,
  danger = false,
}: {
  value: number;
  max: number;
  label: string;
  danger?: boolean;
}) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={`meter ${danger ? "danger" : ""}`}
      aria-label={`${label}: ${value}/${max}`}
    >
      <div className="meter-label">
        <span>{label}</span>
        <span>
          {value} / {max}
        </span>
      </div>
      <div className="meter-track">
        <span className="meter-ghost" style={{ width: `${percent}%` }} />
        <span className="meter-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

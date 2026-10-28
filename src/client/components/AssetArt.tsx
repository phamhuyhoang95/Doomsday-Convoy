import { useState } from "react";
import { resolveAsset } from "../../assets/registry";
import type { AssetKind } from "../../assets/registry";
import { useDefinition } from "../definition";

export function AssetArt({
  id,
  kind,
  label,
  className = "",
}: {
  id?: string | undefined;
  kind: AssetKind;
  label: string;
  className?: string;
}) {
  const definition = useDefinition();
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const asset = resolveAsset(definition.campaign?.assets ?? [], id, kind);
  if (asset.uri && asset.uri !== failedUri && kind !== "sound")
    return (
      <img
        className={`asset-art asset-${kind} ${className}`}
        src={asset.uri}
        alt={label}
        onError={() => setFailedUri(asset.uri ?? null)}
      />
    );
  if (kind === "event" || kind === "location" || kind === "anomaly")
    return (
      <div
        className={`scene-art ${className}`}
        role="img"
        aria-label={`${label} — hình thay thế`}
        data-asset-id={asset.id}
      >
        <div className="scene-moon" />
        <div className="scene-city" />
        <div className="scene-road" />
        <div className="scene-bus">
          <i />
          <i />
        </div>
        <span>ĐƯỜNG ĐI VẪN CÒN.</span>
      </div>
    );
  return (
    <span
      className={`asset-art asset-${kind} ${className}`}
      role="img"
      aria-label={`${label} — hình thay thế`}
      data-asset-id={asset.id}
    >
      {kind === "portrait"
        ? label[0]
        : kind === "vehicle"
          ? "▰"
          : kind === "skill"
            ? "✧"
            : kind === "artifact"
              ? "◇"
              : kind === "sound"
                ? "≋"
                : "◎"}
    </span>
  );
}

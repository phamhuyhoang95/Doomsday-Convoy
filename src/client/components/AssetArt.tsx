import { useState } from "react";
import { resolveAsset } from "../../assets/registry";
import type { AssetKind } from "../../assets/registry";
import { useDefinition } from "../definition";
import { presentationAsset } from "../art/registry";

export function AssetArt({
  id,
  kind,
  label,
  className = "",
  decorative = false,
}: {
  id?: string | undefined;
  kind: AssetKind;
  label: string;
  className?: string;
  decorative?: boolean;
}) {
  const definition = useDefinition();
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const asset = resolveAsset(definition.campaign?.assets ?? [], id, kind);
  const picture = presentationAsset(id, kind);
  const uri = picture?.uri ?? asset.uri;
  if (uri && uri !== failedUri && kind !== "sound") {
    const image = (
      <img
        className={`asset-art asset-${kind} ${kind === "portrait" ? "portrait-source" : className}`}
        src={uri}
        alt={decorative ? "" : label}
        loading="lazy"
        decoding="async"
        data-asset-id={id ?? asset.id}
        onError={() => setFailedUri(uri)}
      />
    );
    return kind === "portrait" ? (
      <span className={`portrait-frame ${className}`}>{image}</span>
    ) : (
      image
    );
  }
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

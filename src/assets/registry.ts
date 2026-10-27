import type { CampaignContent } from "../narrative/schema";

export const ASSET_KINDS = [
  "location",
  "event",
  "portrait",
  "skill",
  "artifact",
  "vehicle",
  "anomaly",
  "sound",
  "fx",
] as const;
export type AssetKind = (typeof ASSET_KINDS)[number];
export type AssetDefinition = CampaignContent["assets"][number];

/** URI-free fallback records keep all game systems usable with no external assets. */
export function fallbackAssets(): AssetDefinition[] {
  return ASSET_KINDS.map((kind) => ({
    id: `asset.fallback.${kind}`,
    kind,
    label: `Placeholder ${kind}`,
  }));
}

export function resolveAsset(
  registry: readonly AssetDefinition[],
  id: string | undefined,
  kind: AssetKind,
): AssetDefinition {
  let asset = registry.find((entry) => entry.id === id && entry.kind === kind);
  const visited = new Set<string>();
  while (asset && !asset.uri && asset.fallbackId && !visited.has(asset.id)) {
    visited.add(asset.id);
    asset = registry.find(
      (entry) => entry.id === asset?.fallbackId && entry.kind === kind,
    );
  }
  return (
    asset ??
    registry.find((entry) => entry.id === `asset.fallback.${kind}`) ?? {
      id: `asset.fallback.${kind}`,
      kind,
      label: `Placeholder ${kind}`,
    }
  );
}

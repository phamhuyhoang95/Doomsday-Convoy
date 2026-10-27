import { fallbackAssets } from "../assets/registry";
import type { AssetDefinition, AssetKind } from "../assets/registry";

export function contentAssets(
  groups: { kind: AssetKind; entries: { id: string; label: string }[] }[],
): AssetDefinition[] {
  return [
    ...fallbackAssets(),
    ...groups.flatMap(({ kind, entries }) =>
      entries.map((entry) => ({
        id: `asset.${entry.id}`,
        kind,
        label: entry.label,
        fallbackId: `asset.fallback.${kind}`,
      })),
    ),
  ];
}

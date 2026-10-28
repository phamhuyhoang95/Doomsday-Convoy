import catalog from "./catalog.json";
import type { AssetKind } from "../../assets/registry";

/** Presentation-only overrides. Art never changes the content bundle used by replay. */
export function presentationAsset(id: string | undefined, kind: AssetKind) {
  return catalog.assets.find((asset) => asset.id === id && asset.kind === kind);
}

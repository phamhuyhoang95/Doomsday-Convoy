import { campaignDefinition } from "../content/campaign";
import { legacyCampaignDefinition } from "../content/registry";
import { LocalSaveStore } from "./local-storage";
import type { KeyValueStorage } from "./local-storage";
import { SaveError } from "./save";

/** Separate namespaces preserve old saves; never fall back silently from a corrupt new save. */
export function loadCompatibleSlot(
  storage: KeyValueStorage,
  slot: string,
  legacyMode = false,
) {
  let definition =
    slot === "legacy" || legacyMode
      ? legacyCampaignDefinition
      : campaignDefinition;
  try {
    return {
      state: new LocalSaveStore(storage, definition).load(
        slot === "legacy" ? "autosave" : legacyMode ? slot : `r1-${slot}`,
      ),
      definition,
    };
  } catch (error) {
    if (
      legacyMode ||
      !(error instanceof SaveError) ||
      error.code !== "NOT_FOUND"
    )
      throw error;
    definition = legacyCampaignDefinition;
    return {
      state: new LocalSaveStore(storage, definition).load(
        slot === "legacy" ? "manual" : slot,
      ),
      definition,
    };
  }
}

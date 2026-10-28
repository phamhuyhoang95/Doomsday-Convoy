import archiveV4 from "./archive/campaign-v4.json";
import { validateWorldDefinition } from "../world/registry";
import { campaignDefinition } from "./campaign";
import { worldDefinition } from "./world";

export const legacyCampaignDefinition = validateWorldDefinition(archiveV4);
export function getContentDefinition(version: string) {
  return [campaignDefinition, legacyCampaignDefinition, worldDefinition].find(
    (definition) => definition.contentVersion === version,
  );
}

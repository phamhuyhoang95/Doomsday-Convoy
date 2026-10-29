import archiveV4 from "./archive/campaign-v4.json";
import { validateWorldDefinition } from "../world/registry";
import { campaignDefinition } from "./campaign";
import { worldDefinition } from "./world";
import { argonDefinition } from "./argon";

export const legacyCampaignDefinition = validateWorldDefinition(archiveV4);
export function getContentDefinition(version: string) {
  return [argonDefinition, campaignDefinition, legacyCampaignDefinition, worldDefinition].find(
    (definition) => definition.contentVersion === version,
  );
}

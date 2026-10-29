import archiveV4 from "./archive/campaign-v4.json";
import { validateWorldDefinition } from "../world/registry";
import { campaignDefinition } from "./campaign";
import { worldDefinition } from "./world";
import { resonanceDefinition } from "./resonance";
import { journeyDefinition } from "./journey";
import { argonDefinition } from "./argon";

export const legacyCampaignDefinition = validateWorldDefinition(archiveV4);
export function getContentDefinition(version: string) {
  return [
    resonanceDefinition,
    journeyDefinition,
    argonDefinition,
    campaignDefinition,
    legacyCampaignDefinition,
    worldDefinition,
  ].find((definition) => definition.contentVersion === version);
}

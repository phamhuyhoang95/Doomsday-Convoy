import { createContext, useContext } from "react";
import { campaignDefinition } from "../content/campaign";
import type { WorldDefinition } from "../world/schema";

export const DefinitionContext =
  createContext<WorldDefinition>(campaignDefinition);
export function useDefinition() {
  return useContext(DefinitionContext);
}

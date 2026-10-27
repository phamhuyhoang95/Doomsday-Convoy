import { campaignDefinition } from "../src/content/campaign";
import { inspectWorldDefinition } from "../src/world/registry";

const issues = inspectWorldDefinition(campaignDefinition);
if (issues.length) {
  console.error(JSON.stringify(issues, null, 2));
  process.exitCode = 1;
} else
  console.log(
    `Campaign ${campaignDefinition.contentVersion}: valid, ${campaignDefinition.campaign?.events.length} events, ${campaignDefinition.campaign?.quests.length} contracts. Schema/operators, IDs, refs, weights, costs, fallback choices and dependency cycles checked.`,
  );

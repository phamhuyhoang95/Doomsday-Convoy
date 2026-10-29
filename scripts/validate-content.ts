import { campaignDefinition } from "../src/content/campaign";
import { resonanceDefinition } from "../src/content/resonance";
import { journeyDefinition } from "../src/content/journey";
import { argonDefinition } from "../src/content/argon";
import { inspectWorldDefinition } from "../src/world/registry";

for (const definition of [
  campaignDefinition,
  argonDefinition,
  journeyDefinition,
  resonanceDefinition,
]) {
  const issues = inspectWorldDefinition(definition);
  if (issues.length) {
    console.error(JSON.stringify(issues, null, 2));
    process.exitCode = 1;
  } else
    console.log(
      `Campaign ${definition.contentVersion}: valid, ${definition.campaign?.events.length} events, ${definition.campaign?.quests.length} contracts, ${definition.campaign?.tactics?.abilities.length ?? 0} tactical abilities. Schema/operators, IDs, refs, weights, costs, fallback choices and dependency cycles checked.`,
    );
}

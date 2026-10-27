import { campaignDefinition } from "../src/content/campaign";
import { assertReplayEquivalent } from "../src/core/replay";
import { loadGame, serializeGame } from "../src/persistence/save";
import { playCampaign } from "../src/simulation/campaign";
import { integerOption, parseArgs } from "./args";

const options = parseArgs(process.argv.slice(2), ["--seed", "--policy"]);
const seed = integerOption(options.get("--seed") ?? "42", 0, 0xffff_ffff);
const policy = options.get("--policy") ?? "peaceful";
if (
  policy !== "peaceful" &&
  policy !== "combat" &&
  policy !== "trade" &&
  policy !== "surrender" &&
  policy !== "fallback" &&
  policy !== "ruthless"
)
  throw new Error("Invalid campaign policy");
const run = playCampaign(seed, policy, campaignDefinition);
assertReplayEquivalent(run.state, campaignDefinition);
loadGame(serializeGame(run.state, campaignDefinition), campaignDefinition);
console.log(
  JSON.stringify(
    {
      seed,
      policy,
      status: run.state.status,
      ending: run.state.ending,
      tick: run.state.world.tick,
      commands: run.state.commandLog.length,
      quests: run.state.activeQuests,
      artifacts: run.state.inventory,
      issue: run.issue,
    },
    null,
    2,
  ),
);
if (run.issue || run.state.status !== "won") process.exitCode = 1;

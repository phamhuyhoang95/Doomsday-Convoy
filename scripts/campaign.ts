import { campaignDefinition } from "../src/content/campaign";
import { resonanceDefinition } from "../src/content/resonance";
import { journeyDefinition } from "../src/content/journey";
import { argonDefinition } from "../src/content/argon";
import { assertReplayEquivalent } from "../src/core/replay";
import { loadGame, serializeGame } from "../src/persistence/save";
import { playCampaign } from "../src/simulation/campaign";
import { integerOption, parseArgs } from "./args";

const options = parseArgs(process.argv.slice(2), [
  "--seed",
  "--policy",
  "--content",
]);
if (
  options.has("--content") &&
  !["resonance", "journey", "argon", "r1"].includes(options.get("--content")!)
)
  throw new Error("Content must be resonance, journey, argon or r1");
const definition =
  options.get("--content") === "resonance"
    ? resonanceDefinition
    : options.get("--content") === "journey"
      ? journeyDefinition
      : options.get("--content") === "argon"
        ? argonDefinition
        : campaignDefinition;
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
const run = playCampaign(seed, policy, definition);
assertReplayEquivalent(run.state, definition);
loadGame(serializeGame(run.state, definition), definition);
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

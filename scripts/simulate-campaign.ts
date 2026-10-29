import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { campaignDefinition } from "../src/content/campaign";
import { argonDefinition } from "../src/content/argon";
import { simulateCampaignBatch } from "../src/simulation/campaign-batch";
import { integerOption, parseArgs } from "./args";

const options = parseArgs(process.argv.slice(2), ["--seeds", "--output", "--content"]);
if (options.has("--content") && !["argon", "r1"].includes(options.get("--content")!)) throw new Error("Content must be argon or r1");
const definition = options.get("--content") === "argon" ? argonDefinition : campaignDefinition;
const seeds = integerOption(options.get("--seeds") ?? "100", 1, 10000);
const report = simulateCampaignBatch(seeds, definition, (done, total) =>
  console.error(`Verified ${done}/${total} campaigns`),
);
console.log(JSON.stringify(report, null, 2));
const output = options.get("--output");
if (output) {
  const path = resolve(output);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}
if (
  report.totals.softlocks ||
  report.totals.rejectedCommands ||
  report.issues.length
)
  process.exitCode = 1;

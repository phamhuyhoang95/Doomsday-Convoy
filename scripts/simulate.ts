import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { worldDefinition } from "../src/content/world";
import { simulateBatch } from "../src/simulation/batch";
import { integerOption, parseArgs } from "./args";

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2), [
    "--seeds",
    "--output",
    "--help",
  ]);
  if (options.has("--help")) {
    console.log(
      "npm run simulate -- --seeds 1000 [--output artifacts/simulation.json]",
    );
    return;
  }
  const count = integerOption(options.get("--seeds") ?? "100", 1, 10_000);
  const report = simulateBatch(count, worldDefinition);
  const json = `${JSON.stringify(report, null, 2)}\n`;
  console.log(json);
  const output = options.get("--output");
  if (output) {
    const target = resolve(output);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, json, "utf8");
    console.log(`Report: ${target}`);
  }
  if (report.totals.softlocks > 0 || report.totals.rejectedCommands > 0)
    process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

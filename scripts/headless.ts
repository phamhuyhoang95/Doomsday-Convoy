import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { SCENARIO_ROUTES, worldDefinition } from "../src/content/world";
import { canonicalJson } from "../src/core/primitives";
import { processCommand } from "../src/core/processor";
import { assertReplayEquivalent } from "../src/core/replay";
import { createGame } from "../src/core/state";
import { loadGame, serializeGame } from "../src/persistence/save";
import { travelCommand } from "../src/simulation/scenarios";
import { integerOption, parseArgs } from "./args";

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2), [
    "--seed",
    "--path",
    "--save",
    "--help",
  ]);
  if (options.has("--help")) {
    console.log(
      "npm run demo -- --seed 42 --path direct|detour|bypass [--save artifacts/demo.save.json]",
    );
    return;
  }
  const seed = integerOption(options.get("--seed") ?? "42", 0, 0xffff_ffff);
  const path = options.get("--path") ?? "direct";
  if (path !== "direct" && path !== "detour" && path !== "bypass")
    throw new Error(`Unknown scenario path: ${path}`);
  let state = createGame(seed, worldDefinition);
  console.log(`LAST CONVOY | headless Phase 1 | seed=${seed} | path=${path}`);
  for (const [index, routeId] of SCENARIO_ROUTES[path].entries()) {
    if (state.status !== "active") break;
    const result = processCommand(
      state,
      travelCommand(state, routeId),
      { principalId: state.player.id },
      worldDefinition,
    );
    if (!result.ok)
      throw new Error(`${result.error.code}: ${result.error.message}`);
    state = result.state;
    const convoy = state.convoys[state.player.convoyId];
    if (!convoy) throw new Error("Missing convoy");
    const location = worldDefinition.locations.find(
      (entry) => entry.id === convoy.locationId,
    );
    console.log(
      `T${state.world.tick} | ${location?.name ?? convoy.locationId} | food=${convoy.resources.food} water=${convoy.resources.water} fuel=${convoy.resources.fuel} vehicle=${convoy.vehicle.condition}`,
    );
    console.log(
      `  events: ${result.events.map((event) => event.payload.type).join(", ")}`,
    );
    if (index === 1) {
      const before = canonicalJson(state);
      state = loadGame(serializeGame(state, worldDefinition), worldDefinition);
      if (canonicalJson(state) !== before)
        throw new Error("Mid-journey save/load diverged");
      console.log(
        "  CHECK: mid-journey save/load equivalent; journey resumed.",
      );
    }
  }
  assertReplayEquivalent(state, worldDefinition);
  const serialized = serializeGame(state, worldDefinition);
  const restored = loadGame(serialized, worldDefinition);
  if (canonicalJson(restored) !== canonicalJson(state))
    throw new Error("Final save/load diverged");
  const savePath = options.get("--save");
  if (savePath) {
    const target = resolve(savePath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, `${serialized}\n`, "utf8");
    const diskState = loadGame(await readFile(target, "utf8"), worldDefinition);
    if (canonicalJson(diskState) !== canonicalJson(state))
      throw new Error("Disk save/load diverged");
    console.log(`SAVE: ${target} (read back and verified)`);
  }
  console.log(
    `RESULT: ${state.status} | ending=${state.ending?.id ?? "none"} | tick=${state.world.tick} | commands=${state.commandLog.length} | events=${state.eventSequence} | rngDraws=${state.rng.draws}`,
  );
  console.log("CHECK: full replay and save/load equivalent.");
  if (state.status !== "won") process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

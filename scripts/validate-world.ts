import { worldDefinition } from "../src/content/world";
import { inspectWorldDefinition } from "../src/world/registry";

const issues = inspectWorldDefinition(worldDefinition);
if (issues.length > 0) {
  console.error(JSON.stringify(issues, null, 2));
  process.exitCode = 1;
} else {
  console.log(
    `World ${worldDefinition.contentVersion}: valid. ${worldDefinition.regions.length} regions, ${worldDefinition.locations.length} locations, ${worldDefinition.routes.length} routes, ${worldDefinition.characters.length} characters.`,
  );
  console.log(
    "Checked schemas, globally unique content IDs, references, route bounds, starting supplies and directed graph reachability.",
  );
}

import { worldDefinitionSchema } from "./schema";
import type { WorldDefinition } from "./schema";
import { inspectCampaignContent } from "../narrative/validation";

export interface ContentIssue {
  path: string;
  message: string;
}

/** Phase 1 graph/reference validation. Event/quest/skill registries come in later phases. */
export function inspectWorldDefinition(input: unknown): ContentIssue[] {
  const parsed = worldDefinitionSchema.safeParse(input);
  if (!parsed.success)
    return parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
  const definition = parsed.data;
  const issues: ContentIssue[] = [];
  const seen = new Set<string>();
  for (const [kind, entries] of [
    ["regions", definition.regions],
    ["locations", definition.locations],
    ["routes", definition.routes],
    ["characters", definition.characters],
  ] as const) {
    for (const entry of entries) {
      if (seen.has(entry.id))
        issues.push({ path: kind, message: `Duplicate ID: ${entry.id}` });
      seen.add(entry.id);
    }
  }
  const requireId = (ids: Set<string>, id: string, path: string): void => {
    if (!ids.has(id))
      issues.push({ path, message: `Unknown reference: ${id}` });
  };
  const regions = new Set(definition.regions.map((region) => region.id));
  const locations = new Set(
    definition.locations.map((location) => location.id),
  );
  const characters = new Set(
    definition.characters.map((character) => character.id),
  );
  definition.locations.forEach((location) =>
    requireId(regions, location.regionId, `locations.${location.id}.regionId`),
  );
  definition.routes.forEach((route) => {
    requireId(locations, route.from, `routes.${route.id}.from`);
    requireId(locations, route.to, `routes.${route.id}.to`);
    if (route.from === route.to)
      issues.push({
        path: `routes.${route.id}`,
        message: "Self-loop routes are not allowed",
      });
  });
  requireId(locations, definition.start.locationId, "start.locationId");
  definition.start.characterIds.forEach((id) =>
    requireId(characters, id, "start.characterIds"),
  );
  if (
    new Set(definition.start.characterIds).size !==
    definition.start.characterIds.length
  ) {
    issues.push({
      path: "start.characterIds",
      message: "Duplicate starting crew member",
    });
  }
  const crewSize = definition.start.characterIds.length;
  if (
    definition.start.resources.food <
      crewSize * definition.rules.foodPerCrewPerTick ||
    definition.start.resources.water <
      crewSize * definition.rules.waterPerCrewPerTick
  ) {
    issues.push({
      path: "start.resources",
      message: "Starting supplies must support at least one tick",
    });
  }
  definition.goal.locationIds.forEach((id) =>
    requireId(locations, id, "goal.locationIds"),
  );
  if (definition.goal.locationIds.includes(definition.start.locationId)) {
    issues.push({
      path: "goal.locationIds",
      message: "Start cannot already be a goal",
    });
  }
  // Directed reachability uses the same edge semantics as travel; no act-specific logic.
  const reachable = new Set([definition.start.locationId]);
  const queue = [definition.start.locationId];
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const route of definition.routes) {
      const destination =
        route.from === current
          ? route.to
          : route.bidirectional && route.to === current
            ? route.from
            : undefined;
      if (destination && !reachable.has(destination)) {
        reachable.add(destination);
        queue.push(destination);
      }
    }
  }
  for (const id of locations) {
    if (!reachable.has(id))
      issues.push({
        path: `locations.${id}`,
        message: "Unreachable from starting location",
      });
  }
  return [...issues, ...inspectCampaignContent(definition)];
}

export function validateWorldDefinition(input: unknown): WorldDefinition {
  const issues = inspectWorldDefinition(input);
  if (issues.length > 0)
    throw new Error(
      `Invalid world content:\n${issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n")}`,
    );
  return worldDefinitionSchema.parse(input);
}

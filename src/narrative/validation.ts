import type { ContentIssue } from "../world/registry";
import type { WorldDefinition } from "../world/schema";
import type { Condition, Effect } from "./schema";

export function inspectCampaignContent(
  definition: WorldDefinition,
): ContentIssue[] {
  const content = definition.campaign;
  if (!content) return [];
  const issues: ContentIssue[] = [];
  const locations = new Set(definition.locations.map((entry) => entry.id));
  const actors = new Set(definition.characters.map((entry) => entry.id));
  const facts = new Set(content.facts.map((entry) => entry.id));
  const artifacts = new Set(content.artifacts.map((entry) => entry.id));
  const quests = new Set(content.quests.map((entry) => entry.id));
  const events = new Set(content.events.map((entry) => entry.id));
  const assets = new Set(content.assets.map((entry) => entry.id));
  const owners = new Set([
    ...locations,
    definition.start.convoyId,
    ...(content.rival ? [content.rival.id] : []),
    ...(content.encounters ?? []).map((entry) => entry.convoyId),
  ]);
  const seen = new Set(
    [
      ...definition.regions,
      ...definition.locations,
      ...definition.routes,
      ...definition.characters,
    ].map((entry) => entry.id),
  );
  for (const entry of [
    ...content.facts,
    ...content.artifacts,
    ...content.skills,
    ...content.quests,
    ...content.events,
    ...content.assets,
    ...content.anomalies,
    ...content.endings,
  ]) {
    if (seen.has(entry.id))
      issues.push({ path: entry.id, message: "Duplicate content ID" });
    seen.add(entry.id);
  }
  const ref = (ids: Set<string>, id: string, path: string): void => {
    if (!ids.has(id))
      issues.push({ path, message: `Unknown reference: ${id}` });
  };
  const text = (key: string): void => {
    if (!Object.hasOwn(content.texts, key))
      issues.push({ path: key, message: "Missing narrative text key" });
  };
  const condition = (item: Condition): void => {
    switch (item.op) {
      case "all":
      case "any":
        item.conditions.forEach(condition);
        break;
      case "not":
        condition(item.condition);
        break;
      case "fact":
      case "known":
        ref(facts, item.id, "condition");
        break;
      case "at":
      case "location":
        ref(locations, item.locationId, "condition");
        break;
      case "actor":
        ref(actors, item.actorId, "condition");
        break;
      case "quest":
        ref(quests, item.questId, "condition");
        break;
      case "owns":
        ref(artifacts, item.artifactId, "condition");
        ref(owners, item.ownerId, "condition");
        break;
      case "pathway":
        ref(
          new Set(content.resonance?.pathways.map((p) => p.id) ?? []),
          item.pathwayId,
          "condition.pathway",
        );
        break;
      case "always":
      case "resource":
        break;
    }
  };
  const effect = (item: Effect): void => {
    switch (item.op) {
      case "fact":
      case "knowledge":
        ref(facts, item.id, "effect");
        break;
      case "artifact":
        ref(artifacts, item.artifactId, "effect");
        ref(owners, item.fromOwnerId, "effect");
        ref(owners, item.toOwnerId, "effect");
        break;
      case "rescue":
      case "actor":
        ref(actors, item.actorId, "effect");
        break;
      case "location":
        ref(locations, item.locationId, "effect");
        break;
      case "combat":
        if (
          item.enemyConvoyId !== content.rival?.id &&
          !content.encounters?.some(
            (entry) => entry.convoyId === item.enemyConvoyId,
          )
        )
          issues.push({ path: "combat", message: "Unknown combat opponent" });
        break;
      case "anomaly":
        if (!content.anomalies.some((entry) => entry.id === item.anomalyId))
          issues.push({ path: "anomaly", message: "Unknown anomaly" });
        break;
      case "resource":
      case "damage":
      case "repair":
      case "restore":
        break;
    }
  };
  for (const [locationId, requirement] of Object.entries(
    content.travelRequirements,
  )) {
    ref(locations, locationId, "travelRequirements");
    condition(requirement);
  }
  for (const event of content.events) {
    event.locationIds.forEach((id) => ref(locations, id, event.id));
    text(event.titleKey);
    text(event.textKey);
    condition(event.trigger);
    event.variants.forEach((variant) => {
      text(variant.textKey);
      condition(variant.when);
    });
    if (
      new Set(event.choices.map((entry) => entry.id)).size !==
      event.choices.length
    )
      issues.push({ path: event.id, message: "Duplicate choice ID" });
    if (
      !event.choices.some(
        (choice) =>
          choice.requirements.op === "always" &&
          Object.values(choice.costs).every((cost) => cost === 0),
      )
    ) {
      issues.push({
        path: event.id,
        message: "Event needs a free unconditional fallback choice",
      });
    }
    for (const choice of event.choices) {
      text(choice.labelKey);
      condition(choice.requirements);
      const total = choice.outcomes.reduce(
        (sum, entry) => sum + entry.weight,
        0,
      );
      if (!Number.isSafeInteger(total) || total > 1_000_000)
        issues.push({
          path: event.id,
          message: "Invalid outcome weight total",
        });
      choice.outcomes.forEach((outcome) => {
        text(outcome.textKey);
        outcome.effects.forEach(effect);
        outcome.hooks.forEach((id) => ref(events, id, "follow-up hook"));
      });
    }
  }
  for (const quest of content.quests) {
    const never = (item: Condition): boolean =>
      (item.op === "not" && item.condition.op === "always") ||
      (item.op === "all" && item.conditions.some(never)) ||
      (item.op === "any" && item.conditions.every(never));
    if (
      [quest.successWhen, quest.failureWhen, quest.alternateWhen].every(never)
    )
      issues.push({
        path: quest.id,
        message: "Quest has no possible terminal resolution",
      });
    text(quest.titleKey);
    text(quest.descriptionKey);
    quest.dependencies.forEach((id) => ref(quests, id, quest.id));
    [
      quest.preconditions,
      quest.successWhen,
      quest.failureWhen,
      quest.alternateWhen,
    ].forEach(condition);
    quest.objectives.forEach((entry) => {
      text(entry.textKey);
      condition(entry.when);
    });
    [...quest.onSuccess, ...quest.onFailure, ...quest.onAlternate].forEach(
      effect,
    );
    const visiting = new Set<string>();
    const visit = (id: string): void => {
      if (visiting.has(id)) {
        issues.push({ path: quest.id, message: "Quest dependency cycle" });
        return;
      }
      visiting.add(id);
      content.quests
        .find((entry) => entry.id === id)
        ?.dependencies.forEach(visit);
      visiting.delete(id);
    };
    visit(quest.id);
  }
  content.artifacts.forEach((entry) => {
    ref(owners, entry.initialOwnerId, entry.id);
    if (entry.assetId) ref(assets, entry.assetId, entry.id);
  });
  content.skills.forEach((entry) => {
    if (entry.factId) ref(facts, entry.factId, entry.id);
    if (entry.assetId) ref(assets, entry.assetId, entry.id);
    condition(entry.requirements);
  });
  content.anomalies.forEach((entry) => {
    ref(facts, entry.ruleFactId, entry.id);
    entry.violationEffects.forEach(effect);
    if (entry.violationEffects.some((item) => item.op === "anomaly"))
      issues.push({
        path: entry.id,
        message: "Nested anomaly effects are not allowed",
      });
  });
  content.assets.forEach((entry) => {
    if (entry.fallbackId) ref(assets, entry.fallbackId, entry.id);
    const chain = new Set<string>();
    let current = entry;
    while (current.fallbackId) {
      if (chain.has(current.id)) {
        issues.push({ path: entry.id, message: "Asset fallback cycle" });
        break;
      }
      chain.add(current.id);
      const next = content.assets.find(
        (asset) => asset.id === current.fallbackId,
      );
      if (!next) break;
      current = next;
    }
  });
  content.endings.forEach((entry) => {
    text(entry.titleKey);
    text(entry.textKey);
    condition(entry.when);
  });
  if (
    content.endings.length &&
    !content.endings.some((entry) => entry.when.op === "always")
  )
    issues.push({
      path: "endings",
      message: "Ending contracts need an unconditional fallback",
    });
  const skills = new Set(content.skills.map((entry) => entry.id));
  if (content.fieldwork) {
    const cfg = content.fieldwork;
    const addId = (id: string) => {
      if (seen.has(id))
        issues.push({ path: id, message: "Duplicate field content ID" });
      seen.add(id);
    };
    for (const r of cfg.roles) ref(actors, r.actorId, "fieldwork.roles");
    if (new Set(cfg.roles.map((r) => r.actorId)).size !== cfg.roles.length)
      issues.push({ path: "fieldwork.roles", message: "Duplicate role actor" });
    for (const site of cfg.sites) {
      addId(site.id);
      ref(locations, site.locationId, site.id);
      ref(facts, site.ruleFactId, site.id);
      ref(facts, site.completedFactId, site.id);
      site.requiresKnowledge.forEach((id) => ref(facts, id, site.id));
      const width = site.grid[0]!.length;
      const floor = (p: { x: number; y: number }) =>
        site.grid[p.y]?.[p.x] === ".";
      if (
        site.grid.some((row) => row.length !== width) ||
        !floor(site.start) ||
        !floor(site.shadowStart) ||
        !site.lights.every(floor)
      )
        issues.push({
          path: site.id,
          message: "Invalid exploration grid/start/light",
        });
      const reachable = new Set<string>(),
        queue = [site.start];
      for (let i = 0; i < queue.length; i++) {
        const p = queue[i]!,
          key = `${p.x},${p.y}`;
        if (reachable.has(key) || !floor(p)) continue;
        reachable.add(key);
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const)
          queue.push({ x: p.x + dx, y: p.y + dy });
      }
      if (
        [
          site.shadowStart,
          ...site.lights,
          ...site.objects.map((o) => o.position),
        ].some((p) => !reachable.has(`${p.x},${p.y}`))
      )
        issues.push({ path: site.id, message: "Disconnected field points" });
      if (
        site.rooms.some(
          (r) =>
            r.x < 0 ||
            r.y < 0 ||
            r.x + r.width > width ||
            r.y + r.height > site.grid.length,
        )
      )
        issues.push({ path: site.id, message: "Room outside grid" });
      if (
        site.objects.some(
          (o) =>
            o.kind === "door" &&
            [site.start, site.shadowStart].some(
              (p) => p.x === o.position.x && p.y === o.position.y,
            ),
        )
      )
        issues.push({
          path: site.id,
          message: "Actor starts inside closed door",
        });
      const cells = new Set<string>();
      for (const o of site.objects) {
        addId(o.id);
        const cell = `${o.position.x},${o.position.y}`;
        if (cells.has(cell) || !floor(o.position))
          issues.push({
            path: o.id,
            message: "Invalid/overlapping field object",
          });
        cells.add(cell);
        if ((o.kind === "cache" || o.kind === "record") && !o.reward)
          issues.push({ path: o.id, message: "Loot requires reward" });
        if (o.reward?.factId) ref(facts, o.reward.factId, o.id);
      }
      if (
        !site.objects.some(
          (o) =>
            o.kind === "exit" &&
            Math.abs(o.position.x - site.start.x) +
              Math.abs(o.position.y - site.start.y) <=
              1,
        )
      )
        issues.push({ path: site.id, message: "Missing reachable entry exit" });
    }
    for (const s of cfg.scenarios) {
      addId(s.id);
      ref(locations, s.locationId, s.id);
      ref(actors, s.rescuedActorId, s.id);
      ref(owners, s.enemyConvoyId, s.id);
      ref(facts, s.completionFactId, s.id);
      ref(facts, s.scoutFactId, s.id);
      const nodes = new Set(s.nodes.map((n) => n.id));
      ref(nodes, s.startNodeId, s.id);
      for (const n of s.nodes) {
        addId(n.id);
        n.connectedNodeIds.forEach((id) => ref(nodes, id, n.id));
        for (const a of n.actions) {
          addId(a.id);
          if (a.factId) ref(facts, a.factId, a.id);
          for (const e of a.effects ?? [])
            if (e.op === "cargo")
              ref(new Set(Object.keys(s.cargoRewards)), e.itemId, a.id);
        }
      }
    }
  }
  if (content.resonance) {
    const unique = new Set(seen);
    for (const path of content.resonance.pathways) {
      if (unique.has(path.id))
        issues.push({ path: path.id, message: "Duplicate pathway" });
      unique.add(path.id);
      if (new Set(path.tiers.map((t) => t.tier)).size !== 3)
        issues.push({ path: path.id, message: "Duplicate tier" });
      for (const tier of path.tiers) {
        ref(skills, tier.skillId, path.id);
        ref(facts, tier.knowledgeId, path.id);
      }
    }
    for (const chapter of content.resonance.chapters) {
      if (unique.has(chapter.id))
        issues.push({ path: chapter.id, message: "Duplicate chapter" });
      unique.add(chapter.id);
      chapter.locationIds.forEach((id) => ref(locations, id, chapter.id));
      for (const o of chapter.objectives)
        ref(o.kind === "visit" ? locations : facts, o.referenceId, chapter.id);
    }
    for (const record of content.resonance.records) {
      if (unique.has(record.id))
        issues.push({ path: record.id, message: "Duplicate record" });
      unique.add(record.id);
      ref(facts, record.factId, record.id);
    }
  }
  if (content.tactics) {
    const abilityIds = new Set<string>();
    for (const ability of content.tactics.abilities) {
      ref(skills, ability.id, "tactics.abilities");
      if (abilityIds.has(ability.id))
        issues.push({
          path: ability.id,
          message: "Duplicate tactical ability",
        });
      abilityIds.add(ability.id);
      if (ability.source === "artifact") {
        if (!ability.artifactId)
          issues.push({
            path: ability.id,
            message: "Artifact ability requires artifactId",
          });
        else ref(artifacts, ability.artifactId, ability.id);
      }
    }
  }
  definition.characters.forEach((entry) =>
    entry.skillIds?.forEach((id) => ref(skills, id, entry.id)),
  );
  if (content.rival) {
    content.rival.characterIds.forEach((id) =>
      ref(actors, id, "rival.characterIds"),
    );
    ref(locations, content.rival.startingLocationId, "rival");
    ref(locations, content.rival.interceptLocationId, "rival");
    ref(artifacts, content.rival.goalArtifactId, "rival");
    condition(content.rival.negotiationCondition);
    if (
      new Set(content.rival.characterIds).size !==
        content.rival.characterIds.length ||
      content.rival.characterIds.some((id) =>
        definition.start.characterIds.includes(id),
      )
    )
      issues.push({
        path: "rival",
        message: "Duplicate or shared crew membership",
      });
  }
  const allocated = new Set([
    ...definition.start.characterIds,
    ...(content.rival?.characterIds ?? []),
  ]);
  const convoyIds = new Set([
    definition.start.convoyId,
    ...(content.rival ? [content.rival.id] : []),
  ]);
  for (const encounter of content.encounters ?? []) {
    if (
      seen.has(encounter.id) ||
      owners.has(encounter.id) ||
      encounter.convoyId === definition.start.convoyId ||
      encounter.convoyId === content.rival?.id
    )
      issues.push({ path: encounter.id, message: "Duplicate encounter ID" });
    seen.add(encounter.id);
    if (convoyIds.has(encounter.convoyId) || seen.has(encounter.convoyId))
      issues.push({
        path: encounter.convoyId,
        message: "Duplicate encounter convoy ID",
      });
    convoyIds.add(encounter.convoyId);
    seen.add(encounter.convoyId);
    ref(locations, encounter.locationId, encounter.id);
    [
      encounter.victoryFactId,
      encounter.capturedFactId,
      encounter.deadFactId,
      encounter.escapeFactId,
    ].forEach((id) => ref(facts, id, encounter.id));
    for (const id of encounter.characterIds) {
      ref(actors, id, encounter.id);
      if (allocated.has(id))
        issues.push({ path: encounter.id, message: "Shared encounter crew" });
      allocated.add(id);
    }
  }
  if (content.operations) {
    const reconLocations = new Set<string>();
    for (const recon of content.operations.recon) {
      ref(locations, recon.locationId, "operations.recon");
      recon.factIds.forEach((id) => ref(facts, id, "operations.recon"));
      if (reconLocations.has(recon.locationId))
        issues.push({
          path: recon.locationId,
          message: "Duplicate recon profile",
        });
      reconLocations.add(recon.locationId);
    }
    for (const entry of [
      ...content.operations.stances,
      ...content.operations.upgrades,
    ]) {
      if (seen.has(entry.id))
        issues.push({
          path: entry.id,
          message: "Duplicate customization ID",
        });
      seen.add(entry.id);
    }
  }
  return issues;
}

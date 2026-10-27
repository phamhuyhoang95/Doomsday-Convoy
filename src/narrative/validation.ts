import type { ContentIssue } from '../world/registry';
import type { WorldDefinition } from '../world/schema';
import type { Condition, Effect } from './schema';

export function inspectCampaignContent(definition: WorldDefinition): ContentIssue[] {
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
  const owners = new Set([...locations, definition.start.convoyId, ...(content.rival ? [content.rival.id] : [])]);
  const seen = new Set([...definition.regions, ...definition.locations, ...definition.routes, ...definition.characters].map((entry) => entry.id));
  for (const entry of [...content.facts, ...content.artifacts, ...content.skills, ...content.quests, ...content.events, ...content.assets, ...content.anomalies]) {
    if (seen.has(entry.id)) issues.push({ path: entry.id, message: 'Duplicate content ID' });
    seen.add(entry.id);
  }
  const ref = (ids: Set<string>, id: string, path: string): void => { if (!ids.has(id)) issues.push({ path, message: `Unknown reference: ${id}` }); };
  const text = (key: string): void => { if (!Object.hasOwn(content.texts, key)) issues.push({ path: key, message: 'Missing narrative text key' }); };
  const condition = (item: Condition): void => {
    switch (item.op) {
      case 'all': case 'any': item.conditions.forEach(condition); break;
      case 'not': condition(item.condition); break;
      case 'fact': case 'known': ref(facts, item.id, 'condition'); break;
      case 'at': case 'location': ref(locations, item.locationId, 'condition'); break;
      case 'actor': ref(actors, item.actorId, 'condition'); break;
      case 'quest': ref(quests, item.questId, 'condition'); break;
      case 'owns': ref(artifacts, item.artifactId, 'condition'); ref(owners, item.ownerId, 'condition'); break;
      case 'always': case 'resource': break;
    }
  };
  const effect = (item: Effect): void => {
    switch (item.op) {
      case 'fact': case 'knowledge': ref(facts, item.id, 'effect'); break;
      case 'artifact': ref(artifacts, item.artifactId, 'effect'); ref(owners, item.fromOwnerId, 'effect'); ref(owners, item.toOwnerId, 'effect'); break;
      case 'rescue': case 'actor': ref(actors, item.actorId, 'effect'); break;
      case 'location': ref(locations, item.locationId, 'effect'); break;
      case 'combat': if (item.enemyConvoyId !== content.rival?.id) issues.push({ path: 'combat', message: 'Unknown combat opponent' }); break;
      case 'anomaly': if (!content.anomalies.some((entry) => entry.id === item.anomalyId)) issues.push({ path: 'anomaly', message: 'Unknown anomaly' }); break;
      case 'resource': case 'damage': case 'repair': break;
    }
  };
  for (const [locationId, requirement] of Object.entries(content.travelRequirements)) { ref(locations, locationId, 'travelRequirements'); condition(requirement); }
  for (const event of content.events) {
    event.locationIds.forEach((id) => ref(locations, id, event.id)); text(event.titleKey); text(event.textKey); condition(event.trigger);
    if (new Set(event.choices.map((entry) => entry.id)).size !== event.choices.length) issues.push({ path: event.id, message: 'Duplicate choice ID' });
    if (!event.choices.some((choice) => choice.requirements.op === 'always' && Object.values(choice.costs).every((cost) => cost === 0))) {
      issues.push({ path: event.id, message: 'Event needs a free unconditional fallback choice' });
    }
    for (const choice of event.choices) {
      text(choice.labelKey); condition(choice.requirements);
      const total = choice.outcomes.reduce((sum, entry) => sum + entry.weight, 0);
      if (!Number.isSafeInteger(total) || total > 1_000_000) issues.push({ path: event.id, message: 'Invalid outcome weight total' });
      choice.outcomes.forEach((outcome) => { text(outcome.textKey); outcome.effects.forEach(effect); outcome.hooks.forEach((id) => ref(events, id, 'follow-up hook')); });
    }
  }
  for (const quest of content.quests) {
    text(quest.titleKey); text(quest.descriptionKey); quest.dependencies.forEach((id) => ref(quests, id, quest.id));
    [quest.preconditions, quest.successWhen, quest.failureWhen, quest.alternateWhen].forEach(condition);
    quest.objectives.forEach((entry) => { text(entry.textKey); condition(entry.when); });
    [...quest.onSuccess, ...quest.onFailure, ...quest.onAlternate].forEach(effect);
    const visiting = new Set<string>();
    const visit = (id: string): void => {
      if (visiting.has(id)) { issues.push({ path: quest.id, message: 'Quest dependency cycle' }); return; }
      visiting.add(id); content.quests.find((entry) => entry.id === id)?.dependencies.forEach(visit); visiting.delete(id);
    };
    visit(quest.id);
  }
  content.artifacts.forEach((entry) => { ref(owners, entry.initialOwnerId, entry.id); if (entry.assetId) ref(assets, entry.assetId, entry.id); });
  content.skills.forEach((entry) => { if (entry.factId) ref(facts, entry.factId, entry.id); if (entry.assetId) ref(assets, entry.assetId, entry.id); condition(entry.requirements); });
  content.anomalies.forEach((entry) => {
    ref(facts, entry.ruleFactId, entry.id); entry.violationEffects.forEach(effect);
    if (entry.violationEffects.some((item) => item.op === 'anomaly')) issues.push({ path: entry.id, message: 'Nested anomaly effects are not allowed' });
  });
  content.assets.forEach((entry) => { if (entry.fallbackId) ref(assets, entry.fallbackId, entry.id); });
  const skills = new Set(content.skills.map((entry) => entry.id));
  definition.characters.forEach((entry) => entry.skillIds?.forEach((id) => ref(skills, id, entry.id)));
  if (content.rival) {
    content.rival.characterIds.forEach((id) => ref(actors, id, 'rival.characterIds'));
    ref(locations, content.rival.startingLocationId, 'rival'); ref(locations, content.rival.interceptLocationId, 'rival');
    ref(artifacts, content.rival.goalArtifactId, 'rival'); condition(content.rival.negotiationCondition);
    if (new Set(content.rival.characterIds).size !== content.rival.characterIds.length
      || content.rival.characterIds.some((id) => definition.start.characterIds.includes(id))) issues.push({ path: 'rival', message: 'Duplicate or shared crew membership' });
  }
  return issues;
}

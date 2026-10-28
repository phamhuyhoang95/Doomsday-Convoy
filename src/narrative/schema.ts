import { z } from "zod";
import { operationsDefinitionSchema } from "../expedition/schema";
import {
  amountSchema,
  emptyResources,
  idSchema,
  RESOURCE_IDS,
  resourcesSchema,
} from "../core/primitives";

export type FactValue = boolean | string | number;
export type Condition =
  | { op: "always" }
  | { op: "all" | "any"; conditions: Condition[] }
  | { op: "not"; condition: Condition }
  | { op: "fact"; id: string; value: FactValue }
  | { op: "known"; id: string }
  | { op: "resource"; resource: (typeof RESOURCE_IDS)[number]; atLeast: number }
  | { op: "at"; locationId: string }
  | { op: "owns"; artifactId: string; ownerId: string }
  | {
      op: "actor";
      actorId: string;
      status: "active" | "downed" | "dead" | "captured";
    }
  | { op: "location"; locationId: string; accessible: boolean }
  | {
      op: "quest";
      questId: string;
      status: "active" | "succeeded" | "failed" | "alternative";
    };

const factValue = z.union([z.boolean(), z.string(), z.number().finite()]);
export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.discriminatedUnion("op", [
    z.object({ op: z.literal("always") }).strict(),
    z
      .object({
        op: z.enum(["all", "any"]),
        conditions: z.array(conditionSchema).min(1).max(30),
      })
      .strict(),
    z.object({ op: z.literal("not"), condition: conditionSchema }).strict(),
    z
      .object({ op: z.literal("fact"), id: idSchema, value: factValue })
      .strict(),
    z.object({ op: z.literal("known"), id: idSchema }).strict(),
    z
      .object({
        op: z.literal("resource"),
        resource: z.enum(RESOURCE_IDS),
        atLeast: amountSchema,
      })
      .strict(),
    z.object({ op: z.literal("at"), locationId: idSchema }).strict(),
    z
      .object({
        op: z.literal("owns"),
        artifactId: idSchema,
        ownerId: idSchema,
      })
      .strict(),
    z
      .object({
        op: z.literal("actor"),
        actorId: idSchema,
        status: z.enum(["active", "downed", "dead", "captured"]),
      })
      .strict(),
    z
      .object({
        op: z.literal("location"),
        locationId: idSchema,
        accessible: z.boolean(),
      })
      .strict(),
    z
      .object({
        op: z.literal("quest"),
        questId: idSchema,
        status: z.enum(["active", "succeeded", "failed", "alternative"]),
      })
      .strict(),
  ]),
);

export const effectSchema = z.discriminatedUnion("op", [
  z
    .object({
      op: z.literal("resource"),
      resource: z.enum(RESOURCE_IDS),
      amount: amountSchema,
    })
    .strict(),
  z
    .object({
      op: z.literal("fact"),
      id: idSchema,
      value: factValue,
      reveal: z.boolean().default(false),
    })
    .strict(),
  z.object({ op: z.literal("knowledge"), id: idSchema }).strict(),
  z
    .object({
      op: z.literal("artifact"),
      artifactId: idSchema,
      fromOwnerId: idSchema,
      toOwnerId: idSchema,
    })
    .strict(),
  z.object({ op: z.literal("rescue"), actorId: idSchema }).strict(),
  z
    .object({
      op: z.literal("damage"),
      target: z.enum(["vehicle", "crew"]),
      amount: amountSchema,
    })
    .strict(),
  z.object({ op: z.literal("repair"), amount: amountSchema }).strict(),
  z
    .object({
      op: z.literal("restore"),
      target: z.enum(["crew", "captives"]),
      amount: amountSchema,
    })
    .strict(),
  z
    .object({
      op: z.literal("anomaly"),
      anomalyId: idSchema,
      obey: z.boolean(),
    })
    .strict(),
  z
    .object({
      op: z.literal("combat"),
      enemyConvoyId: idSchema,
      ambush: z.boolean(),
    })
    .strict(),
  z
    .object({
      op: z.literal("location"),
      locationId: idSchema,
      accessible: z.boolean(),
    })
    .strict(),
  z
    .object({
      op: z.literal("actor"),
      actorId: idSchema,
      status: z.enum(["active", "downed", "dead", "captured"]),
    })
    .strict(),
]);
export type Effect = z.infer<typeof effectSchema>;
const outcomeSchema = z
  .object({
    weight: z.number().int().min(1).max(10000),
    textKey: idSchema,
    effects: z.array(effectSchema),
    hooks: z.array(idSchema).default([]),
  })
  .strict();
export const eventDefinitionSchema = z
  .object({
    id: idSchema,
    version: z.number().int().positive(),
    tags: z.array(idSchema),
    locationIds: z.array(idSchema).min(1),
    trigger: conditionSchema,
    spawn: z
      .object({
        maxOccurrences: z.number().int().min(1).max(10),
        priority: z.number().int().min(0).max(1000),
      })
      .strict(),
    titleKey: idSchema,
    textKey: idSchema,
    variants: z
      .array(z.object({ when: conditionSchema, textKey: idSchema }).strict())
      .default([]),
    choices: z
      .array(
        z
          .object({
            id: idSchema,
            labelKey: idSchema,
            requirements: conditionSchema,
            costs: resourcesSchema.default(emptyResources),
            outcomes: z.array(outcomeSchema).min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();
export const questDefinitionSchema = z
  .object({
    id: idSchema,
    version: z.number().int().positive(),
    titleKey: idSchema,
    descriptionKey: idSchema,
    preconditions: conditionSchema,
    dependencies: z.array(idSchema),
    objectives: z
      .array(
        z
          .object({ id: idSchema, textKey: idSchema, when: conditionSchema })
          .strict(),
      )
      .min(1),
    successWhen: conditionSchema,
    failureWhen: conditionSchema,
    alternateWhen: conditionSchema,
    onSuccess: z.array(effectSchema),
    onFailure: z.array(effectSchema),
    onAlternate: z.array(effectSchema),
  })
  .strict();
export const artifactDefinitionSchema = z
  .object({
    id: idSchema,
    name: z.string(),
    description: z.string(),
    initialOwnerId: idSchema,
    attackBonus: amountSchema,
    defenseBonus: amountSchema,
    assetId: idSchema.optional(),
  })
  .strict();
export const skillDefinitionSchema = z
  .object({
    id: idSchema,
    name: z.string(),
    description: z.string(),
    target: z.enum(["enemy", "ally", "self", "exploration"]),
    effect: z.enum(["damage", "heal", "guard", "reveal"]),
    power: amountSchema,
    energyCost: amountSchema,
    costs: resourcesSchema,
    cooldownTicks: z.number().int().min(0).max(20),
    factId: idSchema.optional(),
    assetId: idSchema.optional(),
    requirements: conditionSchema.default({ op: "always" }),
  })
  .strict();
export const assetDefinitionSchema = z
  .object({
    id: idSchema,
    kind: z.enum([
      "location",
      "event",
      "portrait",
      "skill",
      "artifact",
      "vehicle",
      "anomaly",
      "sound",
      "fx",
    ]),
    label: z.string(),
    uri: z.string().optional(),
    fallbackId: idSchema.optional(),
  })
  .strict();
export const campaignContentSchema = z
  .object({
    operations: operationsDefinitionSchema.optional(),
    encounters: z
      .array(
        z
          .object({
            id: idSchema,
            name: z.string(),
            convoyId: idSchema,
            characterIds: z.array(idSchema).min(1),
            locationId: idSchema,
            resources: resourcesSchema,
            vehicle: z
              .object({
                id: idSchema,
                name: z.string(),
                maxCondition: z.number().int().positive(),
              })
              .strict(),
            victoryFactId: idSchema,
            capturedFactId: idSchema,
            deadFactId: idSchema,
            escapeFactId: idSchema,
            rewardXp: z.number().int().nonnegative(),
          })
          .strict(),
      )
      .optional(),
    id: idSchema,
    texts: z.record(idSchema, z.string().min(1)),
    travelRequirements: z.record(idSchema, conditionSchema).default({}),
    facts: z.array(
      z
        .object({
          id: idSchema,
          description: z.string(),
          initialValue: factValue.optional(),
        })
        .strict(),
    ),
    events: z.array(eventDefinitionSchema),
    quests: z.array(questDefinitionSchema),
    artifacts: z.array(artifactDefinitionSchema),
    skills: z.array(skillDefinitionSchema),
    assets: z.array(assetDefinitionSchema),
    endings: z
      .array(
        z
          .object({
            id: idSchema,
            titleKey: idSchema,
            textKey: idSchema,
            when: conditionSchema,
          })
          .strict(),
      )
      .default([]),
    anomalies: z.array(
      z
        .object({
          id: idSchema,
          name: z.string(),
          ruleFactId: idSchema,
          violationEffects: z.array(effectSchema),
        })
        .strict(),
    ),
    rival: z
      .object({
        id: idSchema,
        name: z.string(),
        characterIds: z.array(idSchema).min(1),
        startingLocationId: idSchema,
        interceptLocationId: idSchema,
        goalArtifactId: idSchema,
        acquireAfterTick: z.number().int().positive(),
        resources: resourcesSchema,
        negotiationCondition: conditionSchema,
        vehicle: z
          .object({
            id: idSchema,
            name: z.string(),
            maxCondition: z.number().int().positive(),
          })
          .strict(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type CampaignContent = z.infer<typeof campaignContentSchema>;
export type EventDefinition = z.infer<typeof eventDefinitionSchema>;
export type QuestDefinition = z.infer<typeof questDefinitionSchema>;

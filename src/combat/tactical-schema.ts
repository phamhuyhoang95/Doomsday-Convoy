import { z } from "zod";
import { idSchema, resourcesSchema } from "../core/primitives";

export const tacticalStatusSchema = z
  .object({
    kind: z.enum([
      "armor-broken",
      "bleed",
      "guard",
      "reflect",
      "fury",
      "barrier",
      "stun",
      "evade",
      "inversion",
    ]),
    actorId: idSchema,
    sourceId: idSchema,
    remainingTurns: z.number().int().min(1).max(10),
    potency: z.number().int().nonnegative(),
  })
  .strict();

export const tacticalStateSchema = z
  .object({
    positions: z.record(idSchema, z.number().int().min(0).max(3)),
    statuses: z.array(tacticalStatusSchema),
    actorTurns: z.record(idSchema, z.number().int().nonnegative()),
    cooldowns: z.record(
      idSchema,
      z.record(idSchema, z.number().int().nonnegative()),
    ),
    vehicleUsedRound: z.number().int().nonnegative(),
    vehicleWard: z
      .object({
        sourceId: idSchema,
        abilityId: idSchema,
        expiresRound: z.number().int().positive(),
        power: z.number().int().positive(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const tacticalAbilitySchema = z
  .object({
    id: idSchema,
    name: z.string().min(1),
    description: z.string().min(1),
    source: z.enum(["actor", "vehicle", "artifact"]),
    artifactId: idSchema.optional(),
    target: z.enum(["enemy", "ally", "self", "vehicle"]),
    reach: z.enum(["front", "any"]),
    effect: z.enum([
      "damage",
      "heal",
      "guard",
      "repair",
      "reflect",
      "shift",
      "fortress",
    ]),
    targetGroup: z.enum(["single", "front", "all"]).optional(),
    fixedDamage: z.boolean().optional(),
    ignoreArmor: z.boolean().optional(),
    selfHealthCost: z.number().int().nonnegative().optional(),
    requiresCorpse: z.boolean().optional(),
    stripGuard: z.boolean().optional(),
    statusRequiresBleed: z.boolean().optional(),
    statusChanceBps: z.number().int().min(0).max(10000).optional(),
    additionalStatuses: z
      .array(
        z
          .object({
            kind: tacticalStatusSchema.shape.kind,
            turns: z.number().int().min(1).max(10),
            potency: z.number().int().nonnegative(),
          })
          .strict(),
      )
      .optional(),
    followupDamage: z.number().int().positive().optional(),
    exploitStatuses: z.array(tacticalStatusSchema.shape.kind).optional(),
    power: z.number().int().nonnegative(),
    energyCost: z.number().int().nonnegative(),
    costs: resourcesSchema,
    cooldownTurns: z.number().int().min(0).max(10),
    appliesStatus: z
      .object({
        kind: tacticalStatusSchema.shape.kind,
        turns: z.number().int().min(1).max(10),
        potency: z.number().int().nonnegative(),
      })
      .strict()
      .optional(),
    exploitStatus: tacticalStatusSchema.shape.kind.optional(),
    bonusBps: z.number().int().min(0).max(20000).optional(),
  })
  .strict();

export const tacticalRulesSchema = z
  .object({
    encounterTicks: z.literal(1),
    abilities: z.array(tacticalAbilitySchema).min(1),
  })
  .strict();
export type TacticalAbility = z.infer<typeof tacticalAbilitySchema>;
export type TacticalStatus = z.infer<typeof tacticalStatusSchema>;

import { z } from "zod";
import { idSchema, resourcesSchema } from "../core/primitives";

export const tacticalStatusSchema = z
  .object({
    kind: z.enum(["armor-broken", "bleed", "guard", "reflect"]),
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
    effect: z.enum(["damage", "heal", "guard", "repair", "reflect"]),
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

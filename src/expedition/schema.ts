import { z } from "zod";
import { idSchema, resourcesSchema } from "../core/primitives";

export const operationsDefinitionSchema = z
  .object({
    rest: z
      .object({
        healthPerTick: z.number().int().positive(),
        energyPerTick: z.number().int().positive(),
      })
      .strict(),
    repair: z
      .object({
        scrapCost: z.number().int().positive(),
        condition: z.number().int().positive(),
      })
      .strict(),
    recon: z.array(
      z
        .object({
          locationId: idSchema,
          description: z.string(),
          factIds: z.array(idSchema),
          duration: z.number().int().min(2).max(24),
          riskReductionBps: z.number().int().min(0).max(9000),
          rewards: resourcesSchema,
        })
        .strict(),
    ),
    progression: z
      .object({
        xpPerPoint: z.number().int().positive(),
        startingPoints: z.number().int().nonnegative(),
        scoutXp: z.number().int().nonnegative(),
        rivalXp: z.number().int().nonnegative(),
      })
      .strict(),
    upgrades: z
      .array(
        z
          .object({
            id: idSchema,
            name: z.string(),
            attribute: z.enum(["attack", "maxHealth", "maxEnergy"]),
            amount: z.number().int().positive(),
          })
          .strict(),
      )
      .min(1),
    stances: z
      .array(
        z
          .object({
            id: idSchema,
            name: z.string(),
            description: z.string(),
            attack: z.number().int().min(-10).max(10),
            defense: z.number().int().min(-10).max(10),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

export const actorProgressionSchema = z
  .object({
    xp: z.number().int().nonnegative(),
    points: z.number().int().nonnegative(),
    upgrades: z.record(idSchema, z.number().int().nonnegative()),
    stanceId: idSchema,
  })
  .strict();
export const expeditionStateSchema = z
  .object({
    recon: z.record(
      idSchema,
      z
        .object({
          scoutedAt: z.number().int().nonnegative(),
          expiresAt: z.number().int().nonnegative(),
          riskReductionBps: z.number().int().min(0).max(9000),
        })
        .strict(),
    ),
  })
  .strict();

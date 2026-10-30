import { z } from "zod";
import { idSchema, resourcesSchema } from "../core/primitives";
import { scenarioDefinitionSchema } from "../scenario/schema";
export const pointSchema = z
  .object({
    x: z.number().int().nonnegative(),
    y: z.number().int().nonnegative(),
  })
  .strict();
export const directionSchema = z.enum(["north", "east", "south", "west"]);
const rewardSchema = z
  .object({
    resources: resourcesSchema,
    xp: z.number().int().nonnegative(),
    remnants: z.number().int().nonnegative(),
    factId: idSchema.optional(),
  })
  .strict();
export const siteSchema = z
  .object({
    id: idSchema,
    name: z.string(),
    locationId: idSchema,
    brief: z.string(),
    requiresKnowledge: z.array(idSchema),
    grid: z
      .array(z.string().regex(/^[#.]+$/))
      .min(5)
      .max(30),
    start: pointSchema,
    shadowStart: pointSchema,
    lights: z.array(pointSchema),
    rooms: z.array(
      z
        .object({
          name: z.string(),
          x: z.number().int(),
          y: z.number().int(),
          width: z.number().int().positive(),
          height: z.number().int().positive(),
        })
        .strict(),
    ),
    objects: z.array(
      z
        .object({
          id: idSchema,
          kind: z.enum(["door", "cache", "record", "exit"]),
          position: pointSchema,
          name: z.string(),
          description: z.string(),
          noise: z.number().int().min(0).max(5),
          reward: rewardSchema.optional(),
        })
        .strict(),
    ),
    reserveHours: z.number().int().min(1).max(4),
    maxBeats: z.number().int().min(40).max(240),
    battery: z.number().int().min(8).max(100),
    capacity: z.number().int().min(1).max(4),
    shadowDamage: z.number().int().positive(),
    rescueDamage: z.number().int().nonnegative(),
    rescueVehicleCost: z.number().int().nonnegative(),
    ruleFactId: idSchema,
    completedFactId: idSchema,
  })
  .strict();
export const fieldworkSchema = z
  .object({
    sites: z.array(siteSchema).min(1),
    roles: z.array(
      z
        .object({
          actorId: idSchema,
          role: z.enum(["commander", "medic", "mechanic", "radio"]),
        })
        .strict(),
    ),
    scenarios: z.array(
      scenarioDefinitionSchema
        .extend({
          durationHours: z.number().int().min(1).max(4),
          enemyConvoyId: idSchema,
          rescuedActorId: idSchema,
          completionFactId: idSchema,
          scoutFactId: idSchema,
          cargoRewards: z.record(idSchema, resourcesSchema),
        })
        .strict(),
    ),
  })
  .strict();
export const expeditionSchema = z
  .object({
    siteId: idSchema,
    actorId: idSchema,
    phase: z.enum(["active", "returned", "rescued"]),
    position: pointSchema,
    shadow: pointSchema,
    facing: directionSchema,
    beat: z.number().int().nonnegative(),
    torch: z.boolean(),
    battery: z.number().int().nonnegative(),
    openDoors: z.array(idSchema),
    collected: z.array(idSchema),
    cargo: z.array(idSchema),
    seen: z.array(z.string()),
    observations: z.number().int().min(0).max(3),
    noise: z.number().int().nonnegative(),
    strikes: z.number().int().nonnegative(),
    cue: z.enum([
      "quiet",
      "knock",
      "advance",
      "light",
      "hit",
      "door",
      "loot",
      "exit",
    ]),
    log: z.array(z.string()),
  })
  .strict();
export const fieldworkStateSchema = z
  .object({
    expedition: expeditionSchema.nullable(),
    completedSiteIds: z.array(idSchema),
  })
  .strict();
export type FieldSite = z.infer<typeof siteSchema>;
export type Expedition = z.infer<typeof expeditionSchema>;
export type Direction = z.infer<typeof directionSchema>;

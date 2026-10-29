import { z } from "zod";
import { idSchema } from "../core/primitives";
import { expeditionStateSchema } from "../expedition/schema";

export const activeEventSchema = z
  .object({
    instanceId: idSchema,
    eventId: idSchema,
    version: z.number().int().positive(),
    locationId: idSchema,
  })
  .strict();
export const questStateSchema = z
  .object({
    id: idSchema,
    templateId: idSchema,
    status: z.enum(["active", "succeeded", "failed", "alternative"]),
    startedAt: z.number().int().nonnegative(),
    resolvedAt: z.number().int().nonnegative().nullable(),
    objectives: z.array(
      z.object({ id: idSchema, complete: z.boolean() }).strict(),
    ),
  })
  .strict();
export const artifactInstanceSchema = z
  .object({ id: idSchema, artifactId: idSchema, ownerId: idSchema })
  .strict();
export const campaignStateSchema = z
  .object({
    operations: expeditionStateSchema.optional(),
    occultRemnants: z.number().int().nonnegative().max(1000000).optional(),
    id: idSchema,
    eventCounts: z.record(idSchema, z.number().int().nonnegative()),
    pendingHooks: z.array(idSchema),
    lastOutcomeKey: idSchema.nullable(),
  })
  .strict();

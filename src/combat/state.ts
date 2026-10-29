import { z } from "zod";
import { idSchema } from "../core/primitives";

export const combatStateSchema = z
  .object({
    id: idSchema,
    enemyConvoyId: idSchema,
    phase: z.enum(["active", "aftermath"]),
    round: z.number().int().positive(),
    turnOrder: z.array(idSchema).min(1),
    turnIndex: z.number().int().nonnegative(),
    defendedActorIds: z.array(idSchema),
    vulnerableActorIds: z.array(idSchema).optional().default([]),
    panickedActorIds: z.array(idSchema).optional().default([]),
    bleedingActorIds: z.array(idSchema).optional().default([]),
    lastEnemyAction: z
      .object({
        actorName: z.string(),
        targetName: z.string(),
        damage: z.number(),
        text: z.string(),
      })
      .optional(),
    log: z.array(z.string()),
  })
  .strict();
export const npcStateSchema = z
  .object({
    id: idSchema,
    goalArtifactId: idSchema,
    intent: z.enum(["guard", "search", "intercept", "defeated"]),
    nextActionTick: z.number().int().nonnegative(),
  })
  .strict();

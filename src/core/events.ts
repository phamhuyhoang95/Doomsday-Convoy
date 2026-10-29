import { z } from "zod";
import { idSchema, resourcesSchema } from "./primitives";

export const failureReasonSchema = z.enum([
  "vehicle-destroyed",
  "supplies-exhausted",
  "no-active-crew",
]);
export type FailureReason = z.infer<typeof failureReasonSchema>;
const payloadSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("expedition.scouted"),
      locationId: idSchema,
      firstVisit: z.boolean(),
      expiresAt: z.number().int().nonnegative(),
      riskReductionBps: z.number().int().nonnegative(),
      rewards: resourcesSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("expedition.rested"),
      ticks: z.number().int().positive(),
      healthRestored: z.number().int().nonnegative(),
      energyRestored: z.number().int().nonnegative(),
    })
    .strict(),
  z
    .object({
      type: z.literal("vehicle.repaired"),
      amount: z.number().int().positive(),
      scrapCost: z.number().int().positive(),
    })
    .strict(),
  z
    .object({
      type: z.literal("actor.progressed"),
      actorId: idSchema,
      xp: z.number().int().nonnegative(),
      pointsGained: z.number().int().nonnegative(),
    })
    .strict(),
  z
    .object({
      type: z.literal("actor.configured"),
      actorId: idSchema,
      upgradeId: idSchema.optional(),
      stanceId: idSchema.optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("combat.victory"),
      enemyConvoyId: idSchema,
      rewards: resourcesSchema,
      xp: z.number().int().nonnegative(),
    })
    .strict(),
  z
    .object({
      type: z.literal("resources.consumed"),
      convoyId: idSchema,
      costs: resourcesSchema,
      reason: z.enum(["travel", "wait", "event", "skill", "combat"]),
    })
    .strict(),
  z
    .object({
      type: z.literal("time.advanced"),
      from: z.number().int().nonnegative(),
      to: z.number().int().positive(),
    })
    .strict(),
  z
    .object({
      type: z.literal("convoy.moved"),
      convoyId: idSchema,
      routeId: idSchema,
      from: idSchema,
      to: idSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("convoy.waited"),
      convoyId: idSchema,
      ticks: z.number().int().positive(),
    })
    .strict(),
  z
    .object({ type: z.literal("location.discovered"), locationId: idSchema })
    .strict(),
  z
    .object({
      type: z.literal("travel.hazard"),
      routeId: idSchema,
      vehicleId: idSchema,
      damage: z.number().int().positive(),
      conditionAfter: z.number().int().nonnegative(),
    })
    .strict(),
  z
    .object({
      type: z.literal("journey.completed"),
      endingId: idSchema,
      locationId: idSchema,
    })
    .strict(),
  z
    .object({ type: z.literal("journey.failed"), reason: failureReasonSchema })
    .strict(),
  z
    .object({
      type: z.literal("artifact.transferred"),
      artifactId: idSchema,
      fromOwnerId: idSchema,
      toOwnerId: idSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("event.resolved"),
      eventId: idSchema,
      choiceId: idSchema,
      outcomeKey: idSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("quest.updated"),
      questId: idSchema,
      status: z.enum(["active", "succeeded", "failed", "alternative"]),
    })
    .strict(),
  z
    .object({
      type: z.literal("combat.started"),
      combatId: idSchema,
      enemyConvoyId: idSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("combat.action"),
      actorId: idSchema,
      action: z.string(),
      targetId: idSchema.optional(),
      amount: z.number().int().nonnegative(),
    })
    .strict(),
  z
    .object({
      type: z.literal("combat.ended"),
      result: z.enum([
        "victory",
        "defeat",
        "retreat",
        "negotiated",
        "surrendered",
      ]),
    })
    .strict(),
  z
    .object({
      type: z.literal("skill.used"),
      actorId: idSchema,
      skillId: idSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("npc.acted"),
      convoyId: idSchema,
      intent: z.string(),
      locationId: idSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("scenario.event"),
      scenarioId: idSchema,
      action: z.string(),
      detail: z.string(),
    })
    .strict(),
]);
export type DomainEventPayload = z.infer<typeof payloadSchema>;
export const domainEventSchema = z
  .object({
    id: idSchema,
    tick: z.number().int().nonnegative(),
    payload: payloadSchema,
  })
  .strict();
export type DomainEvent = z.infer<typeof domainEventSchema>;

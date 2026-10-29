import { z } from "zod";
import { idSchema, resourcesSchema } from "../core/primitives";
export const pathwayStateSchema = z
  .object({
    pathwayId: idSchema,
    tier: z.union([z.literal(9), z.literal(8), z.literal(7)]),
    spentXp: z.number().int().nonnegative(),
  })
  .strict();
export const resonanceSchema = z
  .object({
    pathways: z
      .array(
        z
          .object({
            id: idSchema,
            name: z.string().min(1),
            axiom: z.string().min(1),
            description: z.string().min(1),
            tiers: z
              .array(
                z
                  .object({
                    tier: z.union([z.literal(9), z.literal(8), z.literal(7)]),
                    name: z.string().min(1),
                    skillId: idSchema,
                    xpCost: z.number().int().positive(),
                    remnantCost: z.number().int().positive(),
                    costs: resourcesSchema,
                    riskReductionBps: z
                      .number()
                      .int()
                      .min(0)
                      .max(9000)
                      .optional(),
                    knowledgeId: idSchema,
                  })
                  .strict(),
              )
              .length(3),
          })
          .strict(),
      )
      .length(4),
    chapters: z
      .array(
        z
          .object({
            id: idSchema,
            title: z.string().min(1),
            question: z.string().min(1),
            summary: z.string().min(1),
            locationIds: z.array(idSchema).min(1),
            objectives: z
              .array(
                z
                  .object({
                    label: z.string().min(1),
                    kind: z.enum(["fact", "knowledge", "visit"]),
                    referenceId: idSchema,
                  })
                  .strict(),
              )
              .min(1),
          })
          .strict(),
      )
      .min(1),
    records: z
      .array(
        z
          .object({
            id: idSchema,
            factId: idSchema,
            title: z.string().min(1),
            source: z.string().min(1),
            confidence: z.enum(["observed", "testimony", "inferred"]),
            body: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

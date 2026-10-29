import { z } from "zod";
import { idSchema } from "../core/primitives";

export const scenarioPhaseSchema = z.enum([
  "planning",
  "exploring",
  "crisis",
  "completed",
  "evacuated",
]);
export type ScenarioPhase = z.infer<typeof scenarioPhaseSchema>;

export const scenarioActionSchema = z
  .object({
    id: idSchema,
    name: z.string(),
    description: z.string(),
    requiredRole: z.enum(["commander", "medic", "mechanic"]).optional(),
    alertCost: z.number().int().nonnegative(),
    itemReward: idSchema.optional(),
    factId: idSchema.optional(),
  })
  .strict();
export type ScenarioAction = z.infer<typeof scenarioActionSchema>;

export const scenarioNodeSchema = z
  .object({
    id: idSchema,
    name: z.string(),
    roleHint: z.string(),
    description: z.string(),
    xPercent: z.number().min(0).max(100),
    yPercent: z.number().min(0).max(100),
    connectedNodeIds: z.array(idSchema),
    actions: z.array(scenarioActionSchema),
  })
  .strict();
export type ScenarioNode = z.infer<typeof scenarioNodeSchema>;

export const scenarioDefinitionSchema = z
  .object({
    id: idSchema,
    name: z.string(),
    locationId: idSchema,
    description: z.string(),
    startNodeId: idSchema,
    nodes: z.array(scenarioNodeSchema),
  })
  .strict();
export type ScenarioDefinition = z.infer<typeof scenarioDefinitionSchema>;

export const scenarioStateSchema = z
  .object({
    id: idSchema,
    phase: scenarioPhaseSchema,
    scoutIds: z.array(idSchema).min(1).max(3),
    guardId: idSchema,
    currentNodeId: idSchema,
    visitedNodeIds: z.array(idSchema),
    completedActionIds: z.array(idSchema),
    alert: z.number().int().nonnegative(),
    maxAlert: z.number().int().positive(),
    powerOn: z.boolean(),
    rescuedHa: z.boolean(),
    cargo: z.array(idSchema),
    maxCargo: z.number().int().positive(),
    installedModuleId: idSchema.nullable(),
    log: z.array(z.string()),
  })
  .strict();
export type ScenarioState = z.infer<typeof scenarioStateSchema>;

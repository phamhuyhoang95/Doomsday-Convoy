import { z } from "zod";
import { idSchema } from "./primitives";

const travelSchema = z
  .object({
    type: z.literal("travel"),
    convoyId: idSchema,
    routeId: idSchema,
  })
  .strict();
const waitSchema = z
  .object({
    type: z.literal("wait"),
    convoyId: idSchema,
    ticks: z.number().int().min(1).max(12),
  })
  .strict();
const chooseSchema = z
  .object({
    type: z.literal("choose"),
    convoyId: idSchema,
    instanceId: idSchema,
    choiceId: idSchema,
  })
  .strict();
const investigateSchema = z
  .object({ type: z.literal("investigate"), convoyId: idSchema })
  .strict();
const combatSchema = z
  .object({
    type: z.literal("combat"),
    convoyId: idSchema,
    actorId: idSchema,
    action: z.enum([
      "attack",
      "defend",
      "retreat",
      "negotiate",
      "surrender",
      "capture",
      "finish",
    ]),
    targetId: idSchema.optional(),
  })
  .strict();
const skillSchema = z
  .object({
    type: z.literal("use-skill"),
    convoyId: idSchema,
    actorId: idSchema,
    skillId: idSchema,
    targetId: idSchema.optional(),
  })
  .strict();
const repairSchema = z
  .object({ type: z.literal("repair"), convoyId: idSchema })
  .strict();
const trainSchema = z
  .object({
    type: z.literal("train-actor"),
    convoyId: idSchema,
    actorId: idSchema,
    upgradeId: idSchema,
  })
  .strict();
const stanceSchema = z
  .object({
    type: z.literal("set-stance"),
    convoyId: idSchema,
    actorId: idSchema,
    stanceId: idSchema,
  })
  .strict();

const scenarioStartSchema = z
  .object({
    type: z.literal("scenario-start"),
    convoyId: idSchema,
    scenarioId: idSchema,
    scoutIds: z.array(idSchema).min(1).max(3),
    guardId: idSchema,
  })
  .strict();

const scenarioMoveSchema = z
  .object({
    type: z.literal("scenario-move"),
    convoyId: idSchema,
    targetNodeId: idSchema,
  })
  .strict();

const scenarioActSchema = z
  .object({
    type: z.literal("scenario-act"),
    convoyId: idSchema,
    nodeId: idSchema,
    actionId: idSchema,
  })
  .strict();

const scenarioCrisisSchema = z
  .object({
    type: z.literal("scenario-crisis"),
    convoyId: idSchema,
    method: z.enum(["combat", "decoy", "evacuate"]),
  })
  .strict();

const scenarioFinishSchema = z
  .object({
    type: z.literal("scenario-finish"),
    convoyId: idSchema,
    chosenModuleId: z.enum(["module.fuel-tank", "module.triage-unit"]),
  })
  .strict();

export const commandSchema = z
  .object({
    id: idSchema,
    issuerId: idSchema,
    payload: z.discriminatedUnion("type", [
      travelSchema,
      waitSchema,
      chooseSchema,
      investigateSchema,
      combatSchema,
      skillSchema,
      repairSchema,
      trainSchema,
      stanceSchema,
      scenarioStartSchema,
      scenarioMoveSchema,
      scenarioActSchema,
      scenarioCrisisSchema,
      scenarioFinishSchema,
    ]),
  })
  .strict();

export type GameCommand = z.infer<typeof commandSchema>;
/** Supplied by a trusted adapter; do not derive this from an untrusted command body. */
export interface CommandAuthority {
  readonly principalId: string;
}

export type CommandErrorCode =
  | "INVALID_COMMAND"
  | "INVALID_STATE"
  | "UNAUTHORIZED"
  | "DUPLICATE_COMMAND"
  | "GAME_ENDED"
  | "UNKNOWN_CONVOY"
  | "UNKNOWN_ROUTE"
  | "ROUTE_NOT_CONNECTED"
  | "ROUTE_BLOCKED"
  | "LOCATION_BLOCKED"
  | "INSUFFICIENT_RESOURCES"
  | "REQUIREMENTS_NOT_MET"
  | "NO_ACTIVE_EVENT"
  | "COMBAT_ACTIVE"
  | "NO_COMBAT"
  | "NOT_YOUR_TURN"
  | "INVALID_TARGET"
  | "SKILL_UNAVAILABLE"
  | "SCENARIO_ACTIVE"
  | "INVALID_LOCATION"
  | "INVALID_CREW"
  | "NO_SCENARIO"
  | "INVALID_MOVE"
  | "INVALID_NODE"
  | "ACTION_ALREADY_DONE"
  | "UNKNOWN_ACTION"
  | "ROLE_REQUIRED"
  | "CARGO_FULL"
  | "NO_CRISIS"
  | "NO_DECOY_SUPPLIES"
  | "NOT_READY";

export class CommandError extends Error {
  constructor(
    readonly code: CommandErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CommandError";
  }
}

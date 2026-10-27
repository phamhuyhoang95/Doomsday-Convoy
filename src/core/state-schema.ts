import { z } from "zod";
import { commandSchema } from "./commands";
import { domainEventSchema, failureReasonSchema } from "./events";
import {
  ENGINE_VERSION,
  STATE_SCHEMA_VERSION,
  idSchema,
  resourcesSchema,
  uint32Schema,
} from "./primitives";
import { rngSchema } from "./rng";
import {
  activeEventSchema,
  artifactInstanceSchema,
  campaignStateSchema,
  questStateSchema,
} from "../narrative/state";
import { combatStateSchema, npcStateSchema } from "../combat/state";

const counterSchema = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER);
const actorSchema = z
  .object({
    id: idSchema,
    name: z.string().min(1),
    role: z.string().min(1),
    convoyId: idSchema,
    health: z.number().int().nonnegative(),
    maxHealth: z.number().int().positive(),
    status: z.enum(["active", "downed", "dead", "captured"]),
    attributes: z
      .object({
        attack: z.number().int().positive(),
        defense: z.number().int().nonnegative(),
        maxEnergy: z.number().int().positive(),
      })
      .strict()
      .optional(),
    energy: z.number().int().nonnegative().optional(),
    skillIds: z.array(idSchema).optional(),
    cooldowns: z.record(idSchema, z.number().int().nonnegative()).optional(),
  })
  .strict();
const convoySchema = z
  .object({
    id: idSchema,
    controllerId: idSchema,
    locationId: idSchema,
    actorIds: z.array(idSchema).min(1),
    vehicle: z
      .object({
        id: idSchema,
        name: z.string().min(1),
        condition: z.number().int().nonnegative(),
        maxCondition: z.number().int().positive(),
      })
      .strict(),
    resources: resourcesSchema,
  })
  .strict();

export const commandRecordSchema = z
  .object({
    sequence: z.number().int().positive(),
    principalId: idSchema,
    command: commandSchema,
    tickBefore: counterSchema,
    tickAfter: counterSchema,
    rngBefore: rngSchema,
    rngAfter: rngSchema,
    events: z.array(domainEventSchema),
  })
  .strict();
export type CommandRecord = z.infer<typeof commandRecordSchema>;

export const gameStateSchema = z
  .object({
    schemaVersion: z.literal(STATE_SCHEMA_VERSION),
    engineVersion: z.literal(ENGINE_VERSION),
    contentVersion: z.string().min(1),
    initialSeed: uint32Schema,
    rng: rngSchema,
    status: z.enum(["active", "won", "lost"]),
    ending: z
      .discriminatedUnion("kind", [
        z
          .object({
            kind: z.literal("victory"),
            id: idSchema,
            tick: counterSchema,
            locationId: idSchema,
          })
          .strict(),
        z
          .object({
            kind: z.literal("defeat"),
            id: z.literal("ending.convoy-lost"),
            tick: counterSchema,
            reason: failureReasonSchema,
          })
          .strict(),
      ])
      .nullable(),
    player: z.object({ id: idSchema, convoyId: idSchema }).strict(),
    actors: z.record(idSchema, actorSchema),
    convoys: z.record(idSchema, convoySchema),
    world: z
      .object({
        tick: counterSchema,
        locations: z.record(
          idSchema,
          z
            .object({
              id: idSchema,
              accessible: z.boolean(),
              visits: counterSchema,
            })
            .strict(),
        ),
        routes: z.record(
          idSchema,
          z
            .object({
              id: idSchema,
              accessible: z.boolean(),
              traversals: counterSchema,
            })
            .strict(),
        ),
        facts: z.record(
          idSchema,
          z
            .object({
              value: z.union([z.boolean(), z.string(), z.number().finite()]),
              establishedAt: counterSchema,
            })
            .strict(),
        ),
        // Reserved, explicitly empty until the NPC/ownership systems exist.
        npcs: z.record(idSchema, npcStateSchema),
      })
      .strict(),
    inventory: z
      .object({ artifactInstances: z.record(idSchema, artifactInstanceSchema) })
      .strict(),
    knowledge: z
      .object({ locationIds: z.array(idSchema), factIds: z.array(idSchema) })
      .strict(),
    activeEvents: z.array(activeEventSchema),
    activeQuests: z.array(questStateSchema),
    campaign: campaignStateSchema.nullable(),
    combat: combatStateSchema.nullable(),
    eventSequence: counterSchema,
    commandLog: z.array(commandRecordSchema),
  })
  .strict();

export type GameState = z.infer<typeof gameStateSchema>;
export type ConvoyState = GameState["convoys"][string];
export type ActorState = GameState["actors"][string];

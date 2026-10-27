import { z } from 'zod';
import { amountSchema, idSchema, resourcesSchema } from '../core/primitives';
import { campaignContentSchema } from '../narrative/schema';

const regionSchema = z.object({ id: idSchema, name: z.string().min(1) }).strict();
const locationSchema = z.object({
  id: idSchema, regionId: idSchema, name: z.string().min(1), description: z.string().min(1),
}).strict();
export const routeSchema = z.object({
  id: idSchema,
  from: idSchema,
  to: idSchema,
  bidirectional: z.boolean(),
  travelTicks: z.number().int().min(1).max(24),
  fuelCost: amountSchema,
  risk: z.object({
    chanceBps: z.number().int().min(0).max(10_000),
    minDamage: z.number().int().min(1).max(100),
    maxDamage: z.number().int().min(1).max(100),
  }).strict().refine((risk) => risk.minDamage <= risk.maxDamage, 'minDamage must not exceed maxDamage'),
}).strict();
const characterSchema = z.object({
  id: idSchema, name: z.string().min(1), role: z.string().min(1),
  maxHealth: z.number().int().min(1).max(1000),
  attack: z.number().int().min(1).max(100).optional(), defense: z.number().int().min(0).max(100).optional(),
  maxEnergy: z.number().int().min(1).max(100).optional(), skillIds: z.array(idSchema).optional(),
}).strict();

export const worldDefinitionSchema = z.object({
  contentVersion: z.string().min(1),
  campaign: campaignContentSchema.optional(),
  regions: z.array(regionSchema).min(1),
  locations: z.array(locationSchema).min(2),
  routes: z.array(routeSchema).min(1),
  characters: z.array(characterSchema).min(1),
  start: z.object({
    playerId: idSchema, convoyId: idSchema, locationId: idSchema,
    characterIds: z.array(idSchema).min(1), resources: resourcesSchema,
    vehicle: z.object({ id: idSchema, name: z.string().min(1), maxCondition: z.number().int().min(1).max(1000) }).strict(),
  }).strict(),
  rules: z.object({
    foodPerCrewPerTick: z.number().int().positive().max(100),
    waterPerCrewPerTick: z.number().int().positive().max(100),
    tickMinutes: z.number().int().positive().max(1440),
  }).strict(),
  goal: z.object({
    locationIds: z.array(idSchema).min(1), endingId: idSchema, factId: idSchema,
  }).strict(),
}).strict();

export type WorldDefinition = z.infer<typeof worldDefinitionSchema>;
export type RouteDefinition = z.infer<typeof routeSchema>;

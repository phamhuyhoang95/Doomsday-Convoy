import { z } from 'zod';

export const ENGINE_VERSION = '0.1.0';
export const STATE_SCHEMA_VERSION = 2;
export const RESOURCE_IDS = ['food', 'water', 'fuel', 'medicine', 'scrap'] as const;
export const idSchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/);
export const uint32Schema = z.number().int().min(0).max(0xffff_ffff);
export const amountSchema = z.number().int().nonnegative().max(1_000_000);
export const resourcesSchema = z.object({
  food: amountSchema,
  water: amountSchema,
  fuel: amountSchema,
  medicine: amountSchema,
  scrap: amountSchema,
}).strict();

export type ResourceId = (typeof RESOURCE_IDS)[number];
export type Resources = z.infer<typeof resourcesSchema>;
export const emptyResources = (): Resources => ({ food: 0, water: 0, fuel: 0, medicine: 0, scrap: 0 });

/** Canonical JSON for replay comparison, independent of object insertion order. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

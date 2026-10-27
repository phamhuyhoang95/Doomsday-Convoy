import { z } from 'zod';
import { idSchema } from './primitives';

const travelSchema = z.object({
  type: z.literal('travel'), convoyId: idSchema, routeId: idSchema,
}).strict();
const waitSchema = z.object({
  type: z.literal('wait'), convoyId: idSchema, ticks: z.number().int().min(1).max(12),
}).strict();

export const commandSchema = z.object({
  id: idSchema,
  issuerId: idSchema,
  payload: z.discriminatedUnion('type', [travelSchema, waitSchema]),
}).strict();

export type GameCommand = z.infer<typeof commandSchema>;
/** Supplied by a trusted adapter; do not derive this from an untrusted command body. */
export interface CommandAuthority { readonly principalId: string }

export type CommandErrorCode =
  | 'INVALID_COMMAND' | 'INVALID_STATE' | 'UNAUTHORIZED' | 'DUPLICATE_COMMAND'
  | 'GAME_ENDED' | 'UNKNOWN_CONVOY' | 'UNKNOWN_ROUTE' | 'ROUTE_NOT_CONNECTED'
  | 'ROUTE_BLOCKED' | 'LOCATION_BLOCKED' | 'INSUFFICIENT_RESOURCES';

export class CommandError extends Error {
  constructor(readonly code: CommandErrorCode, message: string) {
    super(message);
    this.name = 'CommandError';
  }
}

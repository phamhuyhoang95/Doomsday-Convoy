import { z } from "zod";
import { uint32Schema } from "./primitives";

export const rngSchema = z
  .object({
    algorithm: z.literal("mulberry32-v1"),
    seed: uint32Schema,
    state: uint32Schema,
    draws: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  })
  .strict();
export type RngState = z.infer<typeof rngSchema>;

export function createRng(seed: number): RngState {
  uint32Schema.parse(seed);
  return { algorithm: "mulberry32-v1", seed, state: seed, draws: 0 };
}

/** Mulberry32, entirely integer based; seed 0 is valid. Never mutates input. */
export function nextUint32(rng: RngState): { value: number; rng: RngState } {
  const state = (rng.state + 0x6d2b79f5) >>> 0;
  let value = state;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return {
    value: (value ^ (value >>> 14)) >>> 0,
    rng: { ...rng, state, draws: rng.draws + 1 },
  };
}

/** Unbiased [0, exclusiveMax) integer via rejection sampling. */
export function nextInt(
  rng: RngState,
  exclusiveMax: number,
): { value: number; rng: RngState } {
  if (
    !Number.isSafeInteger(exclusiveMax) ||
    exclusiveMax < 1 ||
    exclusiveMax > 0x1_0000_0000
  ) {
    throw new RangeError("RNG bound must be an integer in [1, 2^32].");
  }
  const limit = 0x1_0000_0000 - (0x1_0000_0000 % exclusiveMax);
  let draw = nextUint32(rng);
  while (draw.value >= limit) draw = nextUint32(draw.rng);
  return { value: draw.value % exclusiveMax, rng: draw.rng };
}

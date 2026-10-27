export function parseArgs(
  args: string[],
  allowed: readonly string[],
): Map<string, string> {
  const options = new Map<string, string>();
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (!key || !allowed.includes(key) || options.has(key))
      throw new Error(`Unknown or duplicate option: ${String(key)}`);
    if (key === "--help") {
      options.set(key, "true");
      continue;
    }
    const value = args[index + 1];
    if (value === undefined || value.startsWith("--"))
      throw new Error(`Missing value for ${key}`);
    options.set(key, value);
    index += 1;
  }
  return options;
}

export function integerOption(value: string, min: number, max: number): number {
  if (!/^\d+$/.test(value))
    throw new Error(`Expected integer, received: ${value}`);
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < min || result > max)
    throw new Error(`Expected integer in [${min}, ${max}]`);
  return result;
}

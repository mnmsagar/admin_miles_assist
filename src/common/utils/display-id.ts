/**
 * Builds a human-readable display id like `USR-4821` from a prefix and number.
 */
export function formatDisplayId(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(4, '0')}`;
}

/**
 * Given existing display ids (e.g. ["USR-0001", "USR-0007"]) returns the next
 * sequential id for the prefix.
 */
export function nextDisplayId(prefix: string, existing: string[]): string {
  let max = 0;
  for (const id of existing) {
    const m = id.match(/-(\d+)$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return formatDisplayId(prefix, max + 1);
}

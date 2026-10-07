/** A metric value with a vs-previous-period comparison. */
export interface Stat {
  value: number;
  changePercent: number;
  direction: 'up' | 'down' | 'neutral';
}

/** Percentage change of `current` vs `previous`, rounded to 1 decimal. */
export function pctChange(current: number, previous: number): Stat {
  let changePercent: number;
  if (previous === 0) {
    changePercent = current === 0 ? 0 : 100;
  } else {
    changePercent = ((current - previous) / previous) * 100;
  }
  changePercent = Math.round(changePercent * 10) / 10;
  return {
    value: current,
    changePercent,
    direction: changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'neutral',
  };
}

/** First day of the month, optionally offset by N months. */
export function startOfMonth(d: Date, offset = 0): Date {
  return new Date(d.getFullYear(), d.getMonth() + offset, 1);
}

/** Round a number to 2 decimals. */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

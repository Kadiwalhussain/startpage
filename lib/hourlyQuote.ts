import { QUOTES, type Quote } from '../data/quotes';

/**
 * Hour-bucket strategy (documented for Prompt 4):
 *
 * We use **local wall-clock hours**, not UTC epoch hours:
 *   bucket = localDayNumber * 24 + localHour
 *
 * where `localDayNumber` is days since the Unix epoch measured at the user's
 * local midnight. That means:
 * - The quote is stable for a full local hour (e.g. 14:00–14:59 local).
 * - Reloading the new tab within that hour always shows the same quote.
 * - The quote changes at the local top of the next hour.
 *
 * Daily order is a Fisher–Yates shuffle seeded by the local calendar day
 * (YYYYMMDD as an integer), so consecutive hours walk a varied permutation
 * rather than raw array order — still fully deterministic (no unseeded Math.random).
 */

/** Mulberry32 — small, fast, seedable PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates shuffle with a seeded PRNG — pure, deterministic. */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = items.slice();
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

/** Local calendar day as YYYYMMDD integer (e.g. 20260811). */
export function getLocalDaySeed(now: Date): number {
  return now.getFullYear() * 10_000 + (now.getMonth() + 1) * 100 + now.getDate();
}

/**
 * Local hour bucket: distinct integer for each local hour of each local day.
 * Uses local midnight as the day anchor so DST days still get 24 distinct
 * hour slots via getHours() (0–23), not a raw ms/3600000 division.
 */
export function getLocalHourBucket(now: Date): number {
  const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Days since epoch at local midnight (float-safe via UTC ms of that instant)
  const dayIndex = Math.floor(localMidnight.getTime() / 86_400_000);
  return dayIndex * 24 + now.getHours();
}

/** Start of the next local hour (minutes/seconds/ms zeroed, hour + 1). */
export function getNextHourBoundary(now: Date): Date {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
  return next;
}

export type HourlyQuoteSelection = {
  quote: Quote;
  /** Local time when the current hour bucket ends / next quote begins */
  refreshesAt: Date;
  /** Exposed for tests / debugging */
  hourBucket: number;
  daySeed: number;
  index: number;
};

/**
 * Deterministic quote for a given instant.
 * Same local hour → same quote; consecutive hours → different entries in the
 * daily shuffled order (for quote counts ≥ 24).
 */
export function selectHourlyQuote(
  now: Date,
  quotes: readonly Quote[] = QUOTES,
): HourlyQuoteSelection {
  if (quotes.length === 0) {
    throw new Error('selectHourlyQuote: quotes array is empty');
  }

  const daySeed = getLocalDaySeed(now);
  const hourBucket = getLocalHourBucket(now);
  const shuffled = seededShuffle(quotes, daySeed);
  // Walk the daily permutation by local hour (0–23). With 60+ quotes this
  // never repeats within a day; consecutive hours differ by construction.
  const index = now.getHours() % shuffled.length;
  const quote = shuffled[index]!;
  const refreshesAt = getNextHourBoundary(now);

  return { quote, refreshesAt, hourBucket, daySeed, index };
}

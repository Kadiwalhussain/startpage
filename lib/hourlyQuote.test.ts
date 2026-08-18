import { describe, expect, it } from 'vitest';
import { QUOTES } from '../data/quotes';
import {
  getLocalDaySeed,
  getLocalHourBucket,
  getNextHourBoundary,
  mulberry32,
  seededShuffle,
  selectHourlyQuote,
} from './hourlyQuote';

function localDate(
  y: number,
  m: number,
  d: number,
  h = 0,
  min = 0,
  s = 0,
  ms = 0,
): Date {
  return new Date(y, m, d, h, min, s, ms);
}

describe('data/quotes', () => {
  it('contains at least 60 quotes with unique ids', () => {
    expect(QUOTES.length).toBeGreaterThanOrEqual(60);
    const ids = QUOTES.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('requires text and author on every entry', () => {
    for (const q of QUOTES) {
      expect(q.text.trim().length).toBeGreaterThan(0);
      expect(q.author.trim().length).toBeGreaterThan(0);
      expect(q.id.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('seededShuffle / mulberry32', () => {
  it('is deterministic for a fixed seed', () => {
    const a = seededShuffle([1, 2, 3, 4, 5], 42);
    const b = seededShuffle([1, 2, 3, 4, 5], 42);
    expect(a).toEqual(b);
  });

  it('differs across seeds and preserves membership', () => {
    const base = QUOTES.map((q) => q.id);
    const s1 = seededShuffle(base, 1);
    const s2 = seededShuffle(base, 2);
    expect(s1).not.toEqual(s2);
    expect([...s1].sort()).toEqual([...base].sort());
  });

  it('mulberry32 stays in [0, 1)', () => {
    const rand = mulberry32(123);
    for (let i = 0; i < 50; i += 1) {
      const n = rand();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });
});

describe('selectHourlyQuote', () => {
  it('is stable within the same local hour (reload simulation)', () => {
    const a = selectHourlyQuote(localDate(2026, 7, 11, 14, 5, 0));
    const b = selectHourlyQuote(localDate(2026, 7, 11, 14, 59, 30));
    expect(a.quote.id).toBe(b.quote.id);
    expect(a.hourBucket).toBe(b.hourBucket);
  });

  it('changes across consecutive local hours', () => {
    const h14 = selectHourlyQuote(localDate(2026, 7, 11, 14, 0, 0));
    const h15 = selectHourlyQuote(localDate(2026, 7, 11, 15, 0, 0));
    expect(h14.quote.id).not.toBe(h15.quote.id);
  });

  it('uses a daily shuffle — not raw array order for hour 0', () => {
    // Across many days, hour-0 should not always equal QUOTES[0]
    const hourZeroIds = new Set<string>();
    for (let day = 1; day <= 40; day += 1) {
      const sel = selectHourlyQuote(localDate(2026, 0, day, 0, 0, 0));
      hourZeroIds.add(sel.quote.id);
    }
    expect(hourZeroIds.size).toBeGreaterThan(1);
    // At least some days differ from the first array entry
    expect([...hourZeroIds].some((id) => id !== QUOTES[0]!.id)).toBe(true);
  });

  it('sets refreshesAt to the next local hour boundary', () => {
    const now = localDate(2026, 7, 11, 14, 30, 0);
    const { refreshesAt } = selectHourlyQuote(now);
    expect(refreshesAt.getTime()).toBe(getNextHourBoundary(now).getTime());
    expect(refreshesAt.getHours()).toBe(15);
    expect(refreshesAt.getMinutes()).toBe(0);
  });

  it('day seed matches local calendar day', () => {
    const now = localDate(2026, 0, 5, 9, 0, 0);
    expect(getLocalDaySeed(now)).toBe(20260105);
    expect(getLocalHourBucket(now) % 24).toBe(9);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getDayOfYear,
  getTimeRemainingInYear,
  getYearBounds,
  getYearProgress,
  isLeapYear,
} from './yearCountdown';

/**
 * Build a local-timezone Date. Components are wall-clock local values,
 * NOT UTC — matching how the engine interprets the calendar.
 */
function localDate(
  year: number,
  monthIndex: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0,
): Date {
  return new Date(year, monthIndex, day, hour, minute, second, ms);
}

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

describe('isLeapYear', () => {
  it('returns true for ordinary leap years divisible by 4', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2028)).toBe(true);
  });

  it('returns false for non-leap years', () => {
    expect(isLeapYear(2025)).toBe(false);
    expect(isLeapYear(2023)).toBe(false);
  });

  it('handles century rule: divisible by 400 is leap, otherwise not', () => {
    expect(isLeapYear(2000)).toBe(true); // century AND divisible by 400
    expect(isLeapYear(1900)).toBe(false); // century but NOT divisible by 400
    expect(isLeapYear(2100)).toBe(false);
  });
});

describe('getYearBounds', () => {
  it('returns local Jan 1 00:00:00.000 and Dec 31 23:59:59.999', () => {
    const bounds = getYearBounds(localDate(2025, 6, 15, 12, 0, 0));

    expect(bounds.start.getFullYear()).toBe(2025);
    expect(bounds.start.getMonth()).toBe(0);
    expect(bounds.start.getDate()).toBe(1);
    expect(bounds.start.getHours()).toBe(0);
    expect(bounds.start.getMinutes()).toBe(0);
    expect(bounds.start.getSeconds()).toBe(0);
    expect(bounds.start.getMilliseconds()).toBe(0);

    expect(bounds.end.getFullYear()).toBe(2025);
    expect(bounds.end.getMonth()).toBe(11);
    expect(bounds.end.getDate()).toBe(31);
    expect(bounds.end.getHours()).toBe(23);
    expect(bounds.end.getMinutes()).toBe(59);
    expect(bounds.end.getSeconds()).toBe(59);
    expect(bounds.end.getMilliseconds()).toBe(999);
  });

  /**
   * TIMEZONE CORRECTNESS (local, not UTC):
   * The easiest subtle bug is using Date.UTC / getUTC* so "Jan 1" is UTC midnight,
   * which is the previous local evening in US timezones (or next morning in Asia).
   *
   * We construct `now` with the local Date(y, m, d, …) constructor and assert
   * bounds via local getters (getFullYear/getMonth/getDate/getHours) — NOT
   * getUTC*. If the implementation used UTC, getHours() for "start" would
   * typically be non-zero in non-UTC environments (or the calendar day would shift).
   */
  it('computes bounds in local time, not UTC', () => {
    // Fixed wall-clock instant: 2025-03-10 15:30 local (whatever the host TZ is).
    const now = localDate(2025, 2, 10, 15, 30, 0, 0);
    const { start, end } = getYearBounds(now);

    // Local calendar identity of the bounds must match the local year.
    expect(start.getFullYear()).toBe(now.getFullYear());
    expect(start.getMonth()).toBe(0);
    expect(start.getDate()).toBe(1);
    expect(start.getHours()).toBe(0);

    // The start's UTC representation may differ from local midnight — that is
    // expected and proves we did NOT force UTC midnight as the year start.
    // e.g. in America/New_York, local Jan 1 00:00 is 05:00 UTC (EST).
    // We only require local getters to describe Jan 1 00:00:00.000.
    expect(
      start.getHours() === 0 &&
        start.getMinutes() === 0 &&
        start.getSeconds() === 0 &&
        start.getMilliseconds() === 0,
    ).toBe(true);

    // Sanity: end is still the same local calendar year on Dec 31 evening.
    expect(end.getFullYear()).toBe(now.getFullYear());
    expect(end.getMonth()).toBe(11);
    expect(end.getDate()).toBe(31);

    // Cross-check: constructing the expected local start independently must match.
    const expectedStart = localDate(2025, 0, 1, 0, 0, 0, 0);
    expect(start.getTime()).toBe(expectedStart.getTime());
  });
});

describe('getDayOfYear', () => {
  it('returns day 1 on January 1', () => {
    const result = getDayOfYear(localDate(2025, 0, 1, 8, 0, 0));
    expect(result.dayNumber).toBe(1);
    expect(result.totalDaysInYear).toBe(365);
  });

  it('returns day 365 on December 31 of a non-leap year', () => {
    const result = getDayOfYear(localDate(2025, 11, 31, 23, 0, 0));
    expect(result.dayNumber).toBe(365);
    expect(result.totalDaysInYear).toBe(365);
  });

  it('returns 366 total days and day 366 on Dec 31 of leap year 2028', () => {
    expect(isLeapYear(2028)).toBe(true);
    const result = getDayOfYear(localDate(2028, 11, 31, 12, 0, 0));
    expect(result.totalDaysInYear).toBe(366);
    expect(result.dayNumber).toBe(366);
  });

  it('counts Feb 29 as day 60 in a leap year', () => {
    // 2028-02-29 local
    const result = getDayOfYear(localDate(2028, 1, 29, 0, 0, 0));
    expect(result.dayNumber).toBe(60);
    expect(result.totalDaysInYear).toBe(366);
  });
});

describe('getYearProgress', () => {
  it('is ~0% at the start of the year', () => {
    const progress = getYearProgress(localDate(2025, 0, 1, 0, 0, 0, 0));
    expect(progress.elapsedMs).toBe(0);
    expect(progress.percentComplete).toBe(0);
    expect(progress.totalMs).toBeGreaterThan(0);
  });

  it('approaches 100% at Dec 31 23:59:59.999', () => {
    const progress = getYearProgress(localDate(2025, 11, 31, 23, 59, 59, 999));
    expect(progress.percentComplete).toBeGreaterThan(99.999);
    expect(progress.percentComplete).toBeLessThanOrEqual(100);
  });

  it('uses leap-year length for totalMs in 2028 (366-day span)', () => {
    const leap = getYearProgress(localDate(2028, 0, 1, 0, 0, 0, 0));
    const nonLeap = getYearProgress(localDate(2025, 0, 1, 0, 0, 0, 0));
    // Leap years are exactly one nominal day longer in local calendar span
    // (DST may add ±1h on top; compare via day-of-year totals instead).
    expect(getDayOfYear(localDate(2028, 5, 1)).totalDaysInYear).toBe(366);
    expect(getDayOfYear(localDate(2025, 5, 1)).totalDaysInYear).toBe(365);
    // totalMs for leap year must exceed non-leap by roughly one day
    expect(leap.totalMs).toBeGreaterThan(nonLeap.totalMs);
  });

  it('never returns percent outside 0–100', () => {
    const before = getYearProgress(localDate(2024, 11, 31, 23, 59, 59, 999));
    // force a date slightly before year start by using the real start minus 1ms
    const start = getYearBounds(localDate(2025, 5, 1)).start;
    const early = new Date(start.getTime() - 1);
    // early is still 2024 for getYearBounds of early itself — check clamp via progress mid-year
    const mid = getYearProgress(localDate(2025, 6, 1, 12, 0, 0));
    expect(mid.percentComplete).toBeGreaterThanOrEqual(0);
    expect(mid.percentComplete).toBeLessThanOrEqual(100);
    expect(before.percentComplete).toBeLessThanOrEqual(100);
    expect(early.getFullYear()).toBe(2024);
  });
});

describe('getTimeRemainingInYear — non-leap year with fixed now', () => {
  it('computes cascading whole units for a known non-leap instant (2025)', () => {
    // 2025 is not a leap year.
    expect(isLeapYear(2025)).toBe(false);

    // Fixed "now": 2025-07-01 00:00:00.000 local
    const now = localDate(2025, 6, 1, 0, 0, 0, 0);
    const end = getYearBounds(now).end;
    const expectedTotalMs = end.getTime() - now.getTime();

    const remaining = getTimeRemainingInYear(now);

    expect(remaining.totalMs).toBe(expectedTotalMs);
    expect(remaining.totalMs).toBeGreaterThan(0);

    // Cascading whole units must recombine (ignoring sub-second remainder in totalMs).
    const recomposed =
      remaining.days * MS_PER_DAY +
      remaining.hours * MS_PER_HOUR +
      remaining.minutes * MS_PER_MINUTE +
      remaining.seconds * MS_PER_SECOND;
    expect(recomposed).toBeLessThanOrEqual(remaining.totalMs);
    expect(remaining.totalMs - recomposed).toBeLessThan(MS_PER_SECOND);

    // All fields are whole non-negative integers
    for (const n of [
      remaining.days,
      remaining.hours,
      remaining.minutes,
      remaining.seconds,
    ]) {
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(0);
    }
    expect(remaining.hours).toBeLessThan(24);
    expect(remaining.minutes).toBeLessThan(60);
    expect(remaining.seconds).toBeLessThan(60);

    // Independent check of total seconds remaining (floor).
    const expectedTotalSeconds = Math.floor(expectedTotalMs / 1000);
    const actualTotalSeconds =
      remaining.days * 86400 +
      remaining.hours * 3600 +
      remaining.minutes * 60 +
      remaining.seconds;
    expect(actualTotalSeconds).toBe(expectedTotalSeconds);
  });

  it('never returns negative values at or past year end', () => {
    const atEnd = getTimeRemainingInYear(localDate(2025, 11, 31, 23, 59, 59, 999));
    expect(atEnd.totalMs).toBe(0);
    expect(atEnd.days).toBe(0);
    expect(atEnd.hours).toBe(0);
    expect(atEnd.minutes).toBe(0);
    expect(atEnd.seconds).toBe(0);

    // One second before end → 0d 0h 0m 0s if only 999ms left? 
    // 23:59:59.000 → 999ms remaining → 0 seconds whole
    const almost = getTimeRemainingInYear(localDate(2025, 11, 31, 23, 59, 59, 0));
    expect(almost.totalMs).toBe(999);
    expect(almost.seconds).toBe(0);
    expect(almost.days).toBe(0);
  });
});

describe('getTimeRemainingInYear — leap year 2028', () => {
  it('reflects 366-day year length in remaining time from Jan 1', () => {
    expect(isLeapYear(2028)).toBe(true);
    const now = localDate(2028, 0, 1, 0, 0, 0, 0);
    const remaining = getTimeRemainingInYear(now);
    const { totalDaysInYear } = getDayOfYear(now);

    expect(totalDaysInYear).toBe(366);
    // From Jan 1 00:00:00.000 to Dec 31 23:59:59.999 is just under 366 days.
    // Whole days remaining should be 365 (the final partial day is hours/min/sec).
    expect(remaining.days).toBe(365);
    expect(remaining.hours).toBe(23);
    expect(remaining.minutes).toBe(59);
    expect(remaining.seconds).toBe(59);
  });
});

describe('year-boundary rollover Dec 31 → Jan 1', () => {
  it('resets percentComplete near 0 and day-of-year to 1 on the new year', () => {
    const oldYearEnd = localDate(2025, 11, 31, 23, 59, 59, 999);
    const newYearStart = localDate(2026, 0, 1, 0, 0, 0, 0);

    const before = {
      progress: getYearProgress(oldYearEnd),
      day: getDayOfYear(oldYearEnd),
      remaining: getTimeRemainingInYear(oldYearEnd),
    };
    const after = {
      progress: getYearProgress(newYearStart),
      day: getDayOfYear(newYearStart),
      remaining: getTimeRemainingInYear(newYearStart),
    };

    // End of 2025
    expect(before.progress.percentComplete).toBeGreaterThan(99.9);
    expect(before.day.dayNumber).toBe(365);
    expect(before.remaining.totalMs).toBe(0);

    // Start of 2026 — automatic new bounds, no cached state
    expect(after.progress.percentComplete).toBe(0);
    expect(after.progress.elapsedMs).toBe(0);
    expect(after.day.dayNumber).toBe(1);
    expect(after.day.totalDaysInYear).toBe(365); // 2026 is not a leap year
    expect(after.remaining.totalMs).toBeGreaterThan(0);
    expect(after.remaining.days).toBe(364); // from Jan 1 00:00 to Dec 31 23:59:59.999
  });

  it('rolls into a leap year (2027→2028) with 366 total days', () => {
    const newYear = localDate(2028, 0, 1, 0, 0, 0, 0);
    const day = getDayOfYear(newYear);
    const progress = getYearProgress(newYear);

    expect(isLeapYear(2028)).toBe(true);
    expect(day.dayNumber).toBe(1);
    expect(day.totalDaysInYear).toBe(366);
    expect(progress.percentComplete).toBe(0);
  });
});

describe('computeYearCountdown / hook inputs (pure recomputation)', () => {
  // Imported indirectly via re-running pure functions the same way the hook does.
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('self-corrects when system time jumps (simulates backgrounded tab drift)', () => {
    const t0 = localDate(2025, 5, 15, 10, 0, 0, 0);
    vi.setSystemTime(t0);

    const snap0 = getTimeRemainingInYear(new Date());

    // Jump forward 5 minutes without "ticking" a counter — recompute from Date.now().
    vi.setSystemTime(localDate(2025, 5, 15, 10, 5, 0, 0));
    const snap1 = getTimeRemainingInYear(new Date());

    // Remaining should drop by ~5 minutes (300_000 ms), not drift from a counter.
    const delta = snap0.totalMs - snap1.totalMs;
    expect(delta).toBe(5 * MS_PER_MINUTE);
  });
});

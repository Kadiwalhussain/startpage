/**
 * Pure year-countdown time engine.
 *
 * No DOM / browser APIs — safe to import from Node (Vitest) or the extension.
 * All calendar math uses the **local timezone** via the Date(y, m, d, …) constructor
 * and getFullYear / getMonth / getDate (not UTC getters).
 */

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
/** Nominal 24h day used when decomposing remaining ms into whole units. */
const MS_PER_DAY = 24 * MS_PER_HOUR;

export type YearBounds = {
  /** Jan 1 00:00:00.000 local of the date's year */
  start: Date;
  /** Dec 31 23:59:59.999 local of the date's year */
  end: Date;
};

export type YearProgress = {
  elapsedMs: number;
  totalMs: number;
  /** 0–100 */
  percentComplete: number;
};

export type TimeRemaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
};

export type DayOfYear = {
  dayNumber: number;
  totalDaysInYear: number;
};

/**
 * Local-time bounds for the calendar year containing `date`.
 * Intentionally uses the local Date constructor — not Date.UTC — so that
 * "start of year" is the user's midnight on Jan 1, not UTC midnight.
 */
export function getYearBounds(date: Date): YearBounds {
  const year = date.getFullYear();
  const start = new Date(year, 0, 1, 0, 0, 0, 0);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Gregorian leap-year rule, including century-divisible-by-400.
 * Examples: 2000 → true, 1900 → false, 2024 → true, 2025 → false.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Exclusive end of the local calendar year: next Jan 1 00:00:00.000.
 * Using this for duration handles local DST so totalMs is the true wall-clock
 * span of the year, not a hardcoded 365/366 × 86400000 (which can be off by 1h).
 */
function getNextYearStart(date: Date): Date {
  return new Date(date.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
}

/**
 * Progress through the current local year.
 * percentComplete is clamped to [0, 100].
 */
export function getYearProgress(now: Date): YearProgress {
  const { start } = getYearBounds(now);
  const nextYearStart = getNextYearStart(now);
  const totalMs = nextYearStart.getTime() - start.getTime();

  if (totalMs <= 0) {
    return { elapsedMs: 0, totalMs: 0, percentComplete: 0 };
  }

  const rawElapsed = now.getTime() - start.getTime();
  const elapsedMs = Math.min(totalMs, Math.max(0, rawElapsed));
  const percentComplete = (elapsedMs / totalMs) * 100;

  return { elapsedMs, totalMs, percentComplete };
}

/**
 * Time remaining until the end of the local year (Dec 31 23:59:59.999),
 * broken into whole days → hours → minutes → seconds (cascading remainder,
 * not four independent totals). Never negative.
 */
export function getTimeRemainingInYear(now: Date): TimeRemaining {
  const { end } = getYearBounds(now);
  // +1 ms so that standing exactly on end still counts as "at the finish"
  // with 0 remaining; anything past end clamps to 0.
  const totalMs = Math.max(0, end.getTime() - now.getTime());

  let rest = totalMs;
  const days = Math.floor(rest / MS_PER_DAY);
  rest -= days * MS_PER_DAY;
  const hours = Math.floor(rest / MS_PER_HOUR);
  rest -= hours * MS_PER_HOUR;
  const minutes = Math.floor(rest / MS_PER_MINUTE);
  rest -= minutes * MS_PER_MINUTE;
  const seconds = Math.floor(rest / MS_PER_SECOND);

  return { days, hours, minutes, seconds, totalMs };
}

/**
 * 1-based day-of-year in local time (Jan 1 → 1) and the year's day count
 * derived from `isLeapYear` (365 or 366).
 */
export function getDayOfYear(now: Date): DayOfYear {
  const year = now.getFullYear();
  const yearStart = new Date(year, 0, 1, 0, 0, 0, 0);
  // Compare local midnights so DST transitions don't shift the day index.
  const startOfToday = new Date(year, now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const dayNumber =
    Math.round((startOfToday.getTime() - yearStart.getTime()) / MS_PER_DAY) + 1;
  const totalDaysInYear = isLeapYear(year) ? 366 : 365;

  return { dayNumber, totalDaysInYear };
}

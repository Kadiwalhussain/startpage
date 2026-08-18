import { useEffect, useState } from 'react';
import {
  getDayOfYear,
  getTimeRemainingInYear,
  getYearProgress,
  isLeapYear,
} from '../lib/yearCountdown';

export type YearCountdownState = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  percentComplete: number;
  dayNumber: number;
  totalDaysInYear: number;
  isLeapYear: boolean;
  year: number;
};

/**
 * Snapshot the full countdown from a wall-clock `now`.
 * Always recompute year bounds from `now` (never cache them) so New Year's
 * rollover is automatic on the next tick after midnight.
 */
export function computeYearCountdown(now: Date = new Date()): YearCountdownState {
  const remaining = getTimeRemainingInYear(now);
  const progress = getYearProgress(now);
  const day = getDayOfYear(now);
  const year = now.getFullYear();

  return {
    days: remaining.days,
    hours: remaining.hours,
    minutes: remaining.minutes,
    seconds: remaining.seconds,
    percentComplete: progress.percentComplete,
    dayNumber: day.dayNumber,
    totalDaysInYear: day.totalDaysInYear,
    isLeapYear: isLeapYear(year),
    year,
  };
}

/**
 * Live year countdown. Ticks once per second.
 *
 * Drift-safe: each tick calls `Date.now()` / `new Date()` rather than
 * incrementing a counter, so backgrounded tabs self-correct on resume.
 * Year bounds are recomputed every tick for seamless Jan 1 rollover.
 */
export function useYearCountdown(): YearCountdownState {
  const [state, setState] = useState<YearCountdownState>(() =>
    computeYearCountdown(new Date()),
  );

  useEffect(() => {
    const tick = () => {
      setState(computeYearCountdown(new Date()));
    };

    // Align immediately so first paint after mount is fresh.
    tick();
    const id = window.setInterval(tick, 1000);

    return () => {
      window.clearInterval(id);
    };
  }, []);

  return state;
}

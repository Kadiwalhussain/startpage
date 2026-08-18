/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computeYearCountdown, useYearCountdown } from './useYearCountdown';

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

describe('computeYearCountdown', () => {
  it('returns the countdown fields the Orbit Ring binds to', () => {
    const state = computeYearCountdown(localDate(2025, 6, 4, 12, 30, 45));
    expect(state).toEqual(
      expect.objectContaining({
        days: expect.any(Number),
        hours: expect.any(Number),
        minutes: expect.any(Number),
        seconds: expect.any(Number),
        percentComplete: expect.any(Number),
        dayNumber: expect.any(Number),
        totalDaysInYear: expect.any(Number),
        isLeapYear: false,
        year: 2025,
      }),
    );
    expect(state.totalDaysInYear).toBe(365);
  });

  it('reflects leap year 2028 in isLeapYear and totalDaysInYear', () => {
    const state = computeYearCountdown(localDate(2028, 2, 1, 0, 0, 0));
    expect(state.isLeapYear).toBe(true);
    expect(state.totalDaysInYear).toBe(366);
    expect(state.year).toBe(2028);
  });
});

describe('useYearCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('updates from Date.now() each tick (no counter drift)', () => {
    const start = localDate(2025, 0, 15, 0, 0, 0, 0);
    vi.setSystemTime(start);

    const { result } = renderHook(() => useYearCountdown());
    expect(result.current.year).toBe(2025);

    // Jump wall clock by 5s (as if the tab was backgrounded), then fire the interval.
    // The hook must recompute from Date.now() — matching pure computeYearCountdown —
    // rather than incrementing an internal counter by the number of interval fires.
    const jumped = new Date(start.getTime() + 5000);
    act(() => {
      vi.setSystemTime(jumped);
      vi.runOnlyPendingTimers();
    });

    // runOnlyPendingTimers may nudge the mocked clock by the interval period;
    // assert against whatever Date.now() is *after* the tick (same source the hook used).
    const expected = computeYearCountdown(new Date());
    expect(result.current.days).toBe(expected.days);
    expect(result.current.hours).toBe(expected.hours);
    expect(result.current.minutes).toBe(expected.minutes);
    expect(result.current.seconds).toBe(expected.seconds);
    expect(result.current.percentComplete).toBe(expected.percentComplete);
    expect(result.current.dayNumber).toBe(expected.dayNumber);
    // And confirm we actually moved ~5s from the start snapshot.
    expect(Date.now() - start.getTime()).toBeGreaterThanOrEqual(5000);
  });

  it('rolls over to the new year without a page refresh', () => {
    vi.setSystemTime(localDate(2025, 11, 31, 23, 59, 59, 500));

    const { result } = renderHook(() => useYearCountdown());
    expect(result.current.year).toBe(2025);
    expect(result.current.dayNumber).toBe(365);

    act(() => {
      vi.setSystemTime(localDate(2026, 0, 1, 0, 0, 0, 500));
      vi.runOnlyPendingTimers();
    });

    expect(result.current.year).toBe(2026);
    expect(result.current.dayNumber).toBe(1);
    expect(result.current.percentComplete).toBeLessThan(0.001);
    expect(result.current.isLeapYear).toBe(false);
  });

  it('cleans up the interval on unmount', () => {
    vi.setSystemTime(localDate(2025, 3, 1, 0, 0, 0, 0));
    const clearSpy = vi.spyOn(window, 'clearInterval');

    const { unmount } = renderHook(() => useYearCountdown());
    unmount();

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});

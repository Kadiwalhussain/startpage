import { useEffect, useState } from 'react';
import type { Quote } from '../data/quotes';
import { getNextHourBoundary, selectHourlyQuote } from '../lib/hourlyQuote';

export type HourlyQuoteState = {
  quote: Quote;
  refreshesAt: Date;
};

function snapshot(now = new Date()): HourlyQuoteState {
  const { quote, refreshesAt } = selectHourlyQuote(now);
  return { quote, refreshesAt };
}

/**
 * Live hourly quote. Stable within a local hour; auto-advances at the next
 * local hour boundary without a page reload.
 *
 * Scheduling: a timeout aimed at `refreshesAt` (with a small safety pad), then
 * a 60s interval as a backstop if the tab was backgrounded across the boundary.
 * Selection always recomputes from `new Date()` — never increments a counter.
 */
export function useHourlyQuote(): HourlyQuoteState {
  const [state, setState] = useState<HourlyQuoteState>(() => snapshot());

  useEffect(() => {
    let timeoutId: number | undefined;

    const refresh = () => {
      setState(snapshot(new Date()));
    };

    const scheduleForNextBoundary = () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      const now = new Date();
      const boundary = getNextHourBoundary(now);
      // +50ms pad so we land cleanly inside the new hour bucket
      const delay = Math.max(50, boundary.getTime() - now.getTime() + 50);
      timeoutId = window.setTimeout(() => {
        refresh();
        scheduleForNextBoundary();
      }, delay);
    };

    scheduleForNextBoundary();
    // Backstop while backgrounded: re-check every minute
    const intervalId = window.setInterval(refresh, 60_000);

    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  return state;
}

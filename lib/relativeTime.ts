/**
 * Short relative timestamps for note history previews ("2h ago").
 * Pure helper — no Intl relative format dependency required.
 */
export function formatRelativeTime(epochMs: number, nowMs: number = Date.now()): string {
  const delta = Math.max(0, nowMs - epochMs);
  const sec = Math.floor(delta / 1000);
  if (sec < 45) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 14) return `${day}d ago`;
  const week = Math.floor(day / 7);
  return `${week}w ago`;
}

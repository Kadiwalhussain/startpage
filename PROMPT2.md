# Prompt 2 — Year Countdown Time Engine

## Added files

| Path | Role |
| --- | --- |
| `lib/yearCountdown.ts` | Pure local-timezone year math (Node-safe) |
| `lib/yearCountdown.test.ts` | Vitest unit tests for the engine |
| `hooks/useYearCountdown.ts` | `useYearCountdown()` + `computeYearCountdown()` |
| `hooks/useYearCountdown.test.ts` | Hook tests (jsdom) |
| `vitest.config.ts` | WXT + Vitest config |
| `package.prompt2.json` | Full package.json with `test` / `test:watch` scripts |

## Apply package.json updates (one-time)

The agent could not overwrite the existing `package.json` (macOS Desktop TCC). Run this in your terminal from the repo root:

```bash
node scripts/apply-prompt2-package.mjs
pnpm install
pnpm test
```

Or manually:

```bash
cp package.prompt2.json package.json
pnpm install
pnpm test
```

Expected: **24 tests passed**.

## Hook return shape (do not rename — Prompt 3 binds to these)

```ts
{
  days, hours, minutes, seconds,
  percentComplete,      // 0–100
  dayNumber,            // 1-based
  totalDaysInYear,      // 365 | 366
  isLeapYear,
  year
}
```

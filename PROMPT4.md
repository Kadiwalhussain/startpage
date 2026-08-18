# Prompt 4 — Coach & Investor Quote Engine

## Added

| Path | Role |
| --- | --- |
| `data/quotes.ts` | 85 offline curated quotes (`Quote` type) |
| `lib/hourlyQuote.ts` | Pure selection: daily seeded shuffle + local hour bucket |
| `hooks/useHourlyQuote.ts` | Live hook → `{ quote, refreshesAt }` |
| `components/QuoteCard.tsx` | Quiet plaque card + 500ms cross-fade |
| `components/QuoteCardHarness.tsx` | Isolation harness (not in Layout) |
| `lib/hourlyQuote.test.ts` | Determinism / hour-stability tests |

## Hour bucket (documented)

**Local wall-clock hours** — not UTC epoch hours.

- Stable for a full local hour across reloads
- Changes at the local top of the next hour (timeout + 60s backstop)
- Daily Fisher–Yates shuffle seeded by local `YYYYMMDD` so order is varied but deterministic

## Isolation check

Temporarily in `App.tsx` (Prompt 7 removes this):

```tsx
import { QuoteCardHarness } from '../../components/QuoteCardHarness';
// return <QuoteCardHarness />;
```

Or render `<QuoteCard quote={someQuote} />` with a fixed prop.

**Do not mount into Layout yet** — Prompt 7 places it in `data-mount="quote-card"`.

## Verify

```bash
pnpm test
pnpm compile
```

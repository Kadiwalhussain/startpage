# ChronoTab

A Manifest V3 browser extension that replaces the new-tab page with a living year instrument — **the Orbit Ring** — plus a quiet hourly quote, a compact task list, and a scratchpad.

Built with **WXT**, **React 18**, **TypeScript** (strict), **Tailwind CSS**, **Framer Motion**, and **Dexie.js**. Everything is offline: fonts are self-hosted, quotes are bundled, and tasks/notes live in IndexedDB.

---

## Features

- **Orbit Ring** — SVG year-progress ring with month ticks, a brass planet marker, and a live local-timezone countdown (days / hours / minutes / seconds).
- **Hourly quote** — 85 curated coach & investor lines. Stable for the current local hour; cross-fades at the next hour.
- **Tasks** — add, complete, delete, and drag-reorder. Persists in IndexedDB.
- **Notes** — scratchpad with debounced autosave, save indicator, word count, and a collapsible history.
- **Reduced motion** — marker, digits, and fades snap instantly when `prefers-reduced-motion` is on.
- **No network** after install — no Google Fonts CDN, no quote API, no analytics.

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (20+ recommended)
- [pnpm](https://pnpm.io/) (preferred) — or npm / yarn

```bash
# Enable pnpm via Corepack (Node 16.13+)
corepack enable && corepack prepare pnpm@latest --activate
# or: npm install -g pnpm
```

---

## Setup

```bash
git clone https://github.com/Kadiwalhussain/startpage.git
cd startpage
pnpm install
```

`postinstall` runs `wxt prepare` and generates types under `.wxt/`.

Fallback if pnpm is unavailable:

```bash
npm install
```

---

## Scripts

| Script          | Command              | What it does                             |
| --------------- | -------------------- | ---------------------------------------- |
| **Dev**         | `pnpm dev`           | WXT dev server + HMR (Chromium)          |
| **Dev Firefox** | `pnpm dev:firefox`   | Same, targeting Firefox                  |
| **Build**       | `pnpm build`         | Production build → `.output/chrome-mv3/` |
| **Build Firefox** | `pnpm build:firefox` | Production build for Firefox             |
| **Zip**         | `pnpm zip`           | Build + zip for store / distribution     |
| **Test**        | `pnpm test`          | Vitest (unit + hook tests)               |
| **Test watch**  | `pnpm test:watch`    | Vitest watch mode                        |
| Compile         | `pnpm compile`       | Typecheck only (`tsc --noEmit`)          |
| Lint            | `pnpm lint`          | ESLint                                   |
| Format          | `pnpm format`        | Prettier write                           |

---

## Development

```bash
pnpm dev
```

WXT opens a Chromium instance (or prints how to load the unpacked extension). Edit files under `entrypoints/`, `components/`, `hooks/`, and `lib/` — changes hot-reload.

Firefox:

```bash
pnpm dev:firefox
```

---

## Production build

```bash
pnpm build
```

Output directory:

```
.output/chrome-mv3/
```

That folder is a complete unpacked Manifest V3 extension (icons, fonts, and assets bundled).

Firefox:

```bash
pnpm build:firefox
# output: .output/firefox-mv3/
```

---

## Load the unpacked extension

### Chrome / Edge / Brave / Arc

1. Build (or use the folder produced by `pnpm dev` under `.output/`):

   ```bash
   pnpm build
   ```

2. Open `chrome://extensions` (or `edge://extensions`).

3. Enable **Developer mode** (toggle in the top-right).

4. Click **Load unpacked**.

5. Select this folder:

   ```
   <repo-root>/.output/chrome-mv3
   ```

6. Open a **new tab**. You should see the Orbit Ring, a quote plaque, Tasks, and Notes.

To refresh after rebuilds: click the reload icon on the ChronoTab card in `chrome://extensions`, then open a new tab again.

### Firefox

1. `pnpm build:firefox`
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on…**
4. Select `.output/firefox-mv3/manifest.json`
5. Open a new tab

Temporary add-ons in Firefox unload when the browser quits — reload after each restart.

---

## Layout

- **Hero:** Orbit Ring occupies ~65–70vh with air below
- **Desktop (≥1024px):** Quote (7 cols) | Tasks + Notes stacked (5 cols)
- **Tablet / mobile:** Quote → Tasks → Notes, full width

Widgets mount through `Layout`.

---

## Design tokens

Observatory / antique astronomical-instrument palette (Tailwind classes):

| Token        | Hex       | Classes                                 |
| ------------ | --------- | --------------------------------------- |
| `bg-deep`    | `#0B0E1A` | `bg-deep`                               |
| `bg-panel`   | `#12162A` | `bg-panel`                              |
| `brass`      | `#C9A227` | `text-brass`, `bg-brass`, …             |
| `brass-soft` | `#D4AF37` | `text-brass-soft`, …                    |
| `parchment`  | `#EDE6D6` | `text-parchment`, …                     |
| `verdigris`  | `#4A7C7C` | `text-verdigris`, `border-verdigris`, … |

Typography (self-hosted in `assets/fonts/`, SIL OFL 1.1):

- **Display / digits:** `font-display` → JetBrains Mono
- **Body / labels / quotes:** `font-body` → Fraunces

Fonts are bundled so the extension CSP does not need live Google Fonts.

---

## Project structure

```
entrypoints/
  newtab/              # chrome_url_overrides.newtab (WXT convention)
    index.html
    main.tsx
    App.tsx
    style.css
components/
  Layout.tsx           # hero + quote / tasks / notes mounts
  OrbitRing.tsx        # SVG ring + planet marker + countdown
  CountdownUnit.tsx    # odometer-style digit group
  QuoteCard.tsx        # hourly plaque
  TaskWidget.tsx       # mini task list
  NotesWidget.tsx      # scratchpad + history
hooks/
  useYearCountdown.ts  # 1 Hz local-timezone countdown
  useHourlyQuote.ts    # hour-bucket quote + refresh timer
  useTasks.ts          # Dexie live query + mutations
  useNotes.ts
  usePrefersReducedMotion.ts
lib/
  yearCountdown.ts     # pure year math (Node-safe)
  hourlyQuote.ts       # seeded daily shuffle + local hour
  db.ts                # Dexie schema (tasks v1, notes v2)
  relativeTime.ts      # "2h ago" previews
data/
  quotes.ts            # 85 offline quotes
assets/fonts/          # JetBrains Mono + Fraunces
public/icon/           # 16 / 32 / 48 / 96 / 128
```

---

## Data & persistence

Single IndexedDB database: `chronotab-db` (Dexie).

| Version | Store   | Indexes                          |
| ------- | ------- | -------------------------------- |
| v1      | `tasks` | `++id, completed, order, createdAt` |
| v2      | `notes` | `++id, updatedAt`                |

- Tasks: add / toggle / delete / reorder. Incomplete first, then completed.
- Notes: create / update / delete. Autosave is debounced (~650 ms) in the widget, not the hook.
- Existing task rows survive the v1 → v2 upgrade.

All calendar math uses the **local timezone** (not UTC). The year rolls over automatically on the next tick after local midnight on January 1.

Quote selection:

- Daily Fisher–Yates shuffle seeded by local `YYYYMMDD`
- Walked by local hour (`0–23`) so the plaque is stable for a full hour and changes at the local top of the next hour

---

## Testing

```bash
pnpm test
```

| File                            | What it covers                                      |
| ------------------------------- | --------------------------------------------------- |
| `lib/yearCountdown.test.ts`     | leap years, DST-safe remaining time, day-of-year    |
| `hooks/useYearCountdown.test.ts`| live hook ticks (jsdom)                             |
| `lib/hourlyQuote.test.ts`       | determinism and hour-bucket stability               |
| `lib/db.test.ts`                | IndexedDB via `fake-indexeddb`                      |
| `lib/relativeTime.test.ts`      | relative timestamps                                 |

Also useful:

```bash
pnpm compile   # TypeScript
pnpm lint      # ESLint
pnpm build     # full MV3 bundle
```

---

## Stack

- **WXT** — web-extension framework, Manifest V3
- **React 18** + **TypeScript** (strict)
- **Tailwind CSS** — design tokens above
- **Framer Motion** — ring marker, digit slides, quote fade, task reorder
- **Dexie.js** + **dexie-react-hooks** — IndexedDB
- **Vitest** + Testing Library + fake-indexeddb

---

## License

Private / unlicensed unless otherwise stated.

Fonts (JetBrains Mono, Fraunces) are SIL Open Font License 1.1. See `assets/fonts/README.md`.

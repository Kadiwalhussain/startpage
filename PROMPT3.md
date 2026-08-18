# Prompt 3 — Orbit Ring Hero

## What was built

| Path | Role |
| --- | --- |
| `components/OrbitRing.tsx` | SVG progress ring, month ticks, animated planet marker, ambient glow, centered countdown |
| `components/CountdownUnit.tsx` | Odometer-style digit group (Framer `AnimatePresence`, 200ms slide) |
| `components/Layout.tsx` | Hero ~65–70vh + mount slots for quote / tasks / notes |
| `hooks/usePrefersReducedMotion.ts` | Media-query helper for digit animations |
| `entrypoints/newtab/App.prompt3.tsx` | Drop-in App (imports `Layout`) |
| `entrypoints/newtab/style.prompt3.css` | Fonts + Tailwind + reduced-motion base |
| `entrypoints/newtab/main.prompt3.tsx` | Entrypoint wiring `style.css` |

## Apply locked entrypoint files

macOS may block the agent from overwriting existing `App.tsx` / `style.css`. In your terminal:

```bash
# From the startpage repo root:
bash scripts/apply-prompt3.sh
# or manually:
cp entrypoints/newtab/App.prompt3.tsx entrypoints/newtab/App.tsx
cp entrypoints/newtab/style.prompt3.css entrypoints/newtab/style.css
cp entrypoints/newtab/main.prompt3.tsx entrypoints/newtab/main.tsx

pnpm dev
```

A fully verified tree also lives at `~/chronotab-work` and (if present) `Desktop/startpage-prompt3`.

## Design notes

- **Signature motion:** planet marker eases along the ring (`motion.g` + SVG `rotate`).
- **Month ticks:** even `n/12` spacing (commented simplification in `OrbitRing.tsx`).
- **Reduced motion:** Framer `useReducedMotion` + `usePrefersReducedMotion` → instant marker/digit updates; static ring remains.
- **Mount points:** `data-mount="quote-card" | "task-widget" | "notes-widget"` in `Layout.tsx` for Prompts 4–6.

## Handoff

Prompt 4 mounts the quote card into `data-mount="quote-card"` — do not edit `OrbitRing.tsx`.

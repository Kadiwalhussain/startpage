# Prompt 6 — Quick Notes Module

## Added / updated

| Path | Role |
| --- | --- |
| `lib/db.ts` | Schema **v2**: `notes` table added; `tasks` preserved |
| `hooks/useNotes.ts` | Live query + create / update / delete |
| `components/NotesWidget.tsx` | Scratchpad, debounced autosave, history, save indicator |
| `components/NotesWidgetHarness.tsx` | Isolation harness |
| `lib/relativeTime.ts` | "2h ago" previews |

## Schema migration

```ts
// v1 — tasks only (Prompt 5)
// v2 — tasks (unchanged) + notes: '++id, updatedAt'
```

Existing task rows are not wiped.

## Isolation

```tsx
import { NotesWidgetHarness } from '../../components/NotesWidgetHarness';
// return <NotesWidgetHarness />;
```

**Not mounted in Layout** — Prompt 7 places it in `data-mount="notes-widget"`.

## Handoff for Prompt 7

Integrate OrbitRing + QuoteCard + TaskWidget + NotesWidget into one responsive layout and polish.

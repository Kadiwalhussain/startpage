# Prompt 5 — Mini Task Manager

## Added

| Path | Role |
| --- | --- |
| `lib/db.ts` | Dexie DB `chronotab-db` v1 with `tasks` table |
| `hooks/useTasks.ts` | Live query + add / toggle / delete / reorder |
| `components/TaskWidget.tsx` | Compact quiet card (max ~5–6 rows + scroll) |
| `components/TaskWidgetHarness.tsx` | Isolation harness |
| `lib/db.test.ts` | IndexedDB tests via `fake-indexeddb` |

## Dependencies

```bash
pnpm add dexie-react-hooks
pnpm add -D fake-indexeddb   # tests only
```

(`dexie` already installed from Prompt 1.)

## Isolation check

```tsx
import { TaskWidgetHarness } from '../../components/TaskWidgetHarness';
// return <TaskWidgetHarness />;
```

**Not mounted in Layout** — Prompt 7 places it in `data-mount="task-widget"`.

## Handoff for Prompt 6

Add a `notes` table to the **same** `lib/db.ts` / `chronotab-db` (bump schema version). Do not create a second database.

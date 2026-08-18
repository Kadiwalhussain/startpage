import { NotesWidget } from './NotesWidget';

/**
 * Isolation harness for visual verification of NotesWidget.
 * Not wired into Layout — Prompt 7 mounts it into the reserved notes slot.
 *
 * Temporarily: render `<NotesWidgetHarness />` from App.tsx.
 */
export function NotesWidgetHarness() {
  return (
    <div className="flex min-h-[50vh] items-start justify-center bg-deep p-6 sm:items-center">
      <NotesWidget />
    </div>
  );
}

export default NotesWidgetHarness;

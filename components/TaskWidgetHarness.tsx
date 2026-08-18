import { TaskWidget } from './TaskWidget';

/**
 * Isolation harness for visual verification of TaskWidget.
 * Not wired into Layout — Prompt 7 mounts it into the reserved task slot.
 *
 * Temporarily: render `<TaskWidgetHarness />` from App.tsx.
 */
export function TaskWidgetHarness() {
  return (
    <div className="flex min-h-[50vh] items-start justify-center bg-deep p-6 sm:items-center">
      <TaskWidget />
    </div>
  );
}

export default TaskWidgetHarness;

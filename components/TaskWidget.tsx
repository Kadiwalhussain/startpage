import { Reorder, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useTasks } from '../hooks/useTasks';
import type { Task } from '../lib/db';

/**
 * Compact mini task list — quiet secondary widget, never competes with the Orbit Ring.
 * Persists via Dexie (`chronotab-db` / `tasks`).
 */
export function TaskWidget() {
  const { tasks, addTask, toggleTask, deleteTask, reorderTasks } = useTasks();
  const [draft, setDraft] = useState('');
  const prefersReduced = useReducedMotion();

  const submit = useCallback(async () => {
    const value = draft.trim();
    if (!value) return;
    setDraft('');
    await addTask(value);
  }, [addTask, draft]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void submit();
    }
  };

  const incomplete = (tasks ?? []).filter((t) => !t.completed);
  const completed = (tasks ?? []).filter((t) => t.completed);

  const onReorderIncomplete = (next: Task[]) => {
    // Keep completed block after incomplete; reindex full list order
    const merged = [...next, ...completed];
    void reorderTasks(merged);
  };

  return (
    <section
      className="flex w-full flex-col rounded-lg border border-verdigris/20 bg-panel px-4 py-4 sm:px-5 sm:py-5"
      aria-label="Tasks"
    >
      <header className="mb-3">
        <h2 className="font-body text-[0.7rem] font-medium uppercase tracking-[0.28em] text-verdigris sm:text-xs sm:tracking-[0.3em]">
          Tasks
        </h2>
        {/* Engraved-plaque hairline — same language as QuoteCard */}
        <div className="mt-2 h-px w-10 bg-brass/70" role="presentation" />
      </header>

      <form onSubmit={onSubmit} className="mb-3 flex items-center gap-2">
        <label className="sr-only" htmlFor="chronotab-task-input">
          Add a task
        </label>
        <input
          id="chronotab-task-input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Add a task…"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-md border border-verdigris/25 bg-deep/60 px-3 py-2 font-body text-sm text-parchment placeholder:text-verdigris/50 outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
        />
        <button
          type="submit"
          aria-label="Add task"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-brass/40 bg-deep/40 font-display text-lg leading-none text-brass transition-colors hover:border-brass-soft hover:text-brass-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        >
          +
        </button>
      </form>

      {/* Capped height — hard constraint so the list never dominates the ring */}
      <div className="max-h-[13.5rem] overflow-y-auto overscroll-contain pr-0.5 sm:max-h-[15rem]">
        {tasks === undefined ? (
          <p className="py-6 text-center font-body text-sm text-verdigris/60">Loading…</p>
        ) : tasks.length === 0 ? (
          <p className="py-6 text-center font-body text-sm tracking-wide text-verdigris/70">
            Nothing on the list yet.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {/* Incomplete: optional drag reorder via Framer Reorder */}
            {incomplete.length > 0 ? (
              <Reorder.Group
                axis="y"
                values={incomplete}
                onReorder={onReorderIncomplete}
                className="flex list-none flex-col gap-0.5 p-0"
                as="ul"
              >
                {incomplete.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    draggable
                    prefersReduced={!!prefersReduced}
                    onToggle={() => task.id != null && void toggleTask(task.id)}
                    onDelete={() => task.id != null && void deleteTask(task.id)}
                  />
                ))}
              </Reorder.Group>
            ) : null}

            {/* Completed: no drag (order fixed under incomplete) */}
            {completed.length > 0 ? (
              <ul className="mt-0.5 flex list-none flex-col gap-0.5 p-0">
                {completed.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    draggable={false}
                    prefersReduced={!!prefersReduced}
                    onToggle={() => task.id != null && void toggleTask(task.id)}
                    onDelete={() => task.id != null && void deleteTask(task.id)}
                  />
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

type TaskRowProps = {
  task: Task;
  draggable: boolean;
  prefersReduced: boolean;
  onToggle: () => void;
  onDelete: () => void;
};

function TaskRow({ task, draggable, prefersReduced, onToggle, onDelete }: TaskRowProps) {
  const body = (
    <>
      <button
        type="button"
        role="checkbox"
        aria-checked={task.completed}
        aria-label={task.completed ? `Mark incomplete: ${task.text}` : `Complete: ${task.text}`}
        onClick={onToggle}
        className={[
          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
          task.completed
            ? 'border-brass/70 bg-brass/20 text-brass'
            : 'border-verdigris/50 bg-deep/40 text-transparent hover:border-brass/60',
        ].join(' ')}
      >
        <svg
          viewBox="0 0 12 12"
          className="h-2.5 w-2.5"
          aria-hidden
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 6.5 L5 9 L9.5 3.5" />
        </svg>
      </button>

      <motion.span
        className="min-w-0 flex-1 font-body text-sm leading-snug text-parchment"
        initial={false}
        animate={{
          opacity: task.completed ? 0.45 : 1,
        }}
        transition={prefersReduced ? { duration: 0 } : { duration: 0.22 }}
        style={{
          textDecoration: task.completed ? 'line-through' : 'none',
          textDecorationColor: 'rgba(74, 124, 124, 0.7)',
        }}
      >
        {task.text}
      </motion.span>

      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete: ${task.text}`}
        className="ml-1 shrink-0 rounded px-1.5 py-0.5 font-body text-xs text-verdigris/50 opacity-100 transition-opacity hover:text-brass/90 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brass sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
      >
        ×
      </button>
    </>
  );

  const rowClass =
    'group flex items-start gap-2.5 rounded-md px-1.5 py-1.5 transition-colors hover:bg-deep/35';

  if (draggable) {
    return (
      <Reorder.Item
        value={task}
        as="li"
        className={`${rowClass} cursor-grab active:cursor-grabbing`}
        whileDrag={prefersReduced ? undefined : { scale: 1.01, zIndex: 2 }}
      >
        {body}
      </Reorder.Item>
    );
  }

  return <li className={rowClass}>{body}</li>;
}

export default TaskWidget;

import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import { db, type Task } from '../lib/db';

export type UseTasksResult = {
  /** Sorted: incomplete first (by order), then completed (by order). undefined while loading. */
  tasks: Task[] | undefined;
  addTask: (text: string) => Promise<void>;
  toggleTask: (id: number) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  reorderTasks: (newOrder: Task[]) => Promise<void>;
};

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // Incomplete first
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    if (a.order !== b.order) return a.order - b.order;
    return a.createdAt - b.createdAt;
  });
}

/**
 * Reactive task list backed by Dexie live queries.
 * UI updates automatically on any IndexedDB change to `tasks`.
 */
export function useTasks(): UseTasksResult {
  const tasks = useLiveQuery(async () => {
    const rows = await db.tasks.toArray();
    return sortTasks(rows);
  }, []);

  const addTask = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const maxOrder = await db.tasks.orderBy('order').last();
    const nextOrder = (maxOrder?.order ?? -1) + 1;

    await db.tasks.add({
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
      order: nextOrder,
    });
  }, []);

  const toggleTask = useCallback(async (id: number) => {
    const task = await db.tasks.get(id);
    if (!task) return;
    await db.tasks.update(id, { completed: !task.completed });
  }, []);

  const deleteTask = useCallback(async (id: number) => {
    await db.tasks.delete(id);
  }, []);

  const reorderTasks = useCallback(async (newOrder: Task[]) => {
    await db.transaction('rw', db.tasks, async () => {
      await Promise.all(
        newOrder.map((task, index) => {
          if (task.id == null) return Promise.resolve(0);
          return db.tasks.update(task.id, { order: index });
        }),
      );
    });
  }, []);

  return {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    reorderTasks,
  };
}

import Dexie, { type EntityTable } from 'dexie';

/**
 * ChronoTab local persistence (IndexedDB via Dexie).
 * Single database for tasks and notes.
 */

export interface Task {
  /** Auto-increment primary key */
  id?: number;
  text: string;
  completed: boolean;
  /** Epoch ms */
  createdAt: number;
  /** Manual / display order (lower first among peers) */
  order: number;
}

export interface Note {
  /** Auto-increment primary key */
  id?: number;
  content: string;
  /** Epoch ms — updated on every save */
  updatedAt: number;
}

export class ChronoTabDB extends Dexie {
  tasks!: EntityTable<Task, 'id'>;
  notes!: EntityTable<Note, 'id'>;

  constructor() {
    super('chronotab-db');

    // v1 baseline — keep declared so upgrades migrate cleanly.
    this.version(1).stores({
      tasks: '++id, completed, order, createdAt',
    });

    // v2: add notes without changing the tasks store definition
    // (repeating tasks with the same schema preserves existing rows).
    this.version(2).stores({
      tasks: '++id, completed, order, createdAt',
      notes: '++id, updatedAt',
    });
  }
}

/** Shared singleton — import from hooks / widgets. */
export const db = new ChronoTabDB();

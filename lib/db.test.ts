import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ChronoTabDB, db, type Note, type Task } from './db';

describe('chronotab-db', () => {
  beforeEach(async () => {
    await db.tasks.clear();
    await db.notes.clear();
  });

  afterEach(async () => {
    await db.tasks.clear();
    await db.notes.clear();
  });

  it('uses database name chronotab-db', () => {
    expect(db.name).toBe('chronotab-db');
  });

  it('adds and reads tasks with auto-increment ids', async () => {
    const id = await db.tasks.add({
      text: 'Ship ChronoTab',
      completed: false,
      createdAt: Date.now(),
      order: 0,
    });
    expect(typeof id).toBe('number');

    const row = await db.tasks.get(id);
    expect(row?.text).toBe('Ship ChronoTab');
    expect(row?.completed).toBe(false);
  });

  it('toggles and deletes tasks', async () => {
    const id = (await db.tasks.add({
      text: 'Toggle me',
      completed: false,
      createdAt: Date.now(),
      order: 1,
    })) as number;

    await db.tasks.update(id, { completed: true });
    expect((await db.tasks.get(id))?.completed).toBe(true);

    await db.tasks.delete(id);
    expect(await db.tasks.get(id)).toBeUndefined();
  });

  it('preserves tasks after notes schema is available (v2)', async () => {
    const taskId = await db.tasks.add({
      text: 'Survives notes migration',
      completed: false,
      createdAt: Date.now(),
      order: 0,
    });

    const noteId = await db.notes.add({
      content: 'Hello',
      updatedAt: Date.now(),
    });

    expect(await db.tasks.get(taskId)).toMatchObject({
      text: 'Survives notes migration',
    });
    expect(await db.notes.get(noteId)).toMatchObject({ content: 'Hello' });
  });

  it('updates note content and updatedAt', async () => {
    const id = (await db.notes.add({
      content: 'v1',
      updatedAt: 1000,
    })) as number;

    await db.notes.update(id, { content: 'v2', updatedAt: 2000 });
    const row = await db.notes.get(id);
    expect(row?.content).toBe('v2');
    expect(row?.updatedAt).toBe(2000);
  });

  it('orders notes by updatedAt descending via index', async () => {
    await db.notes.bulkAdd([
      { content: 'old', updatedAt: 100 },
      { content: 'new', updatedAt: 300 },
      { content: 'mid', updatedAt: 200 },
    ]);
    const ordered = await db.notes.orderBy('updatedAt').reverse().toArray();
    expect(ordered.map((n) => n.content)).toEqual(['new', 'mid', 'old']);
  });

  it('exposes typed Task and Note shapes', () => {
    const task: Task = {
      text: 'typed',
      completed: false,
      createdAt: 0,
      order: 0,
    };
    const note: Note = { content: 'n', updatedAt: 0 };
    expect(task.text).toBe('typed');
    expect(note.content).toBe('n');
    const alt = new ChronoTabDB();
    expect(alt.name).toBe('chronotab-db');
    alt.close();
  });
});

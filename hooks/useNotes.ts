import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import { db, type Note } from '../lib/db';

export type UseNotesResult = {
  /** Most recently edited first. undefined while the live query is loading. */
  notes: Note[] | undefined;
  createNote: (content: string) => Promise<number>;
  updateNote: (id: number, content: string) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
};

/**
 * Reactive notes list backed by Dexie live queries.
 * Debounced autosave lives in the component layer, not here.
 */
export function useNotes(): UseNotesResult {
  const notes = useLiveQuery(async () => {
    // Indexed by updatedAt — reverse for newest-first
    return db.notes.orderBy('updatedAt').reverse().toArray();
  }, []);

  const createNote = useCallback(async (content: string): Promise<number> => {
    const id = await db.notes.add({
      content,
      updatedAt: Date.now(),
    });
    return id as number;
  }, []);

  const updateNote = useCallback(async (id: number, content: string) => {
    await db.notes.update(id, {
      content,
      updatedAt: Date.now(),
    });
  }, []);

  const deleteNote = useCallback(async (id: number) => {
    await db.notes.delete(id);
  }, []);

  return {
    notes,
    createNote,
    updateNote,
    deleteNote,
  };
}

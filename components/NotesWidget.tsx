import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNotes } from '../hooks/useNotes';
import type { Note } from '../lib/db';
import { formatRelativeTime } from '../lib/relativeTime';

/** Keystroke → IndexedDB debounce window (component-layer, not the hook). */
const AUTOSAVE_MS = 650;

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved';

/**
 * Quick-capture scratchpad + collapsible history.
 * Quiet secondary widget — same visual language as QuoteCard / TaskWidget.
 */
export function NotesWidget() {
  const { notes, createNote, updateNote, deleteNote } = useNotes();
  const prefersReduced = useReducedMotion();

  const [activeId, setActiveId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [historyOpen, setHistoryOpen] = useState(false);

  const saveTimer = useRef<number | undefined>(undefined);
  const creatingRef = useRef(false);
  const activeIdRef = useRef<number | null>(null);
  const draftRef = useRef('');

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  // On first load: open most recent note (if any) once notes arrive.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current || notes === undefined) return;
    hydratedRef.current = true;
    if (notes.length > 0) {
      const latest = notes[0]!;
      setActiveId(latest.id ?? null);
      setDraft(latest.content);
      setSaveState('saved');
    }
  }, [notes]);

  const flushSave = useCallback(async () => {
    const content = draftRef.current;
    const id = activeIdRef.current;

    // Empty draft with no id — nothing to persist
    if (!content.trim() && id == null) {
      setSaveState('idle');
      return;
    }

    setSaveState('saving');
    try {
      if (id == null) {
        if (creatingRef.current) return;
        creatingRef.current = true;
        const newId = await createNote(content);
        setActiveId(newId);
        activeIdRef.current = newId;
        creatingRef.current = false;
      } else {
        await updateNote(id, content);
      }
      setSaveState('saved');
    } catch {
      creatingRef.current = false;
      setSaveState('dirty');
    }
  }, [createNote, updateNote]);

  const scheduleSave = useCallback(() => {
    setSaveState('dirty');
    if (saveTimer.current !== undefined) {
      window.clearTimeout(saveTimer.current);
    }
    saveTimer.current = window.setTimeout(() => {
      void flushSave();
    }, AUTOSAVE_MS);
  }, [flushSave]);

  // Flush pending debounce on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current !== undefined) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, []);

  const onChange = (value: string) => {
    setDraft(value);
    draftRef.current = value;
    scheduleSave();
  };

  const startNewNote = async () => {
    // Persist current draft first if dirty
    if (saveTimer.current !== undefined) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = undefined;
    }
    if (saveState === 'dirty' || saveState === 'saving') {
      await flushSave();
    }

    setActiveId(null);
    activeIdRef.current = null;
    setDraft('');
    draftRef.current = '';
    setSaveState('idle');
    setHistoryOpen(false);
  };

  const openNote = async (note: Note) => {
    if (note.id == null) return;

    if (saveTimer.current !== undefined) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = undefined;
    }
    if (
      activeIdRef.current != null &&
      activeIdRef.current !== note.id &&
      (saveState === 'dirty' || saveState === 'saving')
    ) {
      await flushSave();
    }

    setActiveId(note.id);
    activeIdRef.current = note.id;
    setDraft(note.content);
    draftRef.current = note.content;
    setSaveState('saved');
    setHistoryOpen(false);
  };

  const onDeleteHistory = async (id: number) => {
    await deleteNote(id);
    if (activeIdRef.current === id) {
      setActiveId(null);
      activeIdRef.current = null;
      setDraft('');
      draftRef.current = '';
      setSaveState('idle');
    }
  };

  const wordCount = useMemo(() => {
    const trimmed = draft.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [draft]);

  const history = notes ?? [];

  return (
    <section
      className="flex w-full flex-col rounded-lg border border-verdigris/20 bg-panel px-4 py-4 sm:px-5 sm:py-5"
      aria-label="Notes"
    >
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-body text-[0.7rem] font-medium uppercase tracking-[0.28em] text-verdigris sm:text-xs sm:tracking-[0.3em]">
            Notes
          </h2>
          <div className="mt-2 h-px w-10 bg-brass/70" role="presentation" />
        </div>

        <div className="flex items-center gap-2">
          <SaveIndicator state={saveState} prefersReduced={!!prefersReduced} />
          <button
            type="button"
            onClick={() => void startNewNote()}
            className="rounded-md border border-verdigris/25 bg-deep/40 px-2 py-1 font-body text-[0.65rem] uppercase tracking-[0.18em] text-verdigris transition-colors hover:border-brass/40 hover:text-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            New note
          </button>
        </div>
      </header>

      <label className="sr-only" htmlFor="chronotab-note-input">
        Quick note
      </label>
      <textarea
        id="chronotab-note-input"
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Jot something down…"
        rows={5}
        spellCheck
        className="min-h-[7.5rem] w-full resize-y rounded-md border border-verdigris/25 bg-deep/60 px-3 py-2.5 font-body text-sm leading-relaxed text-parchment placeholder:text-verdigris/50 outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
      />

      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className="font-body text-[0.65rem] tabular-nums text-verdigris/55">
          {wordCount === 0 ? ' ' : `${wordCount} ${wordCount === 1 ? 'word' : 'words'}`}
        </p>
      </div>

      {/* Collapsed-by-default history — subordinate to the scratchpad */}
      <div className="mt-3 border-t border-verdigris/15 pt-2.5">
        <button
          type="button"
          onClick={() => setHistoryOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 py-1 font-body text-[0.65rem] uppercase tracking-[0.2em] text-verdigris/80 transition-colors hover:text-brass/90"
          aria-expanded={historyOpen}
        >
          <span>History{history.length > 0 ? ` · ${history.length}` : ''}</span>
          <span aria-hidden className="text-verdigris/50">
            {historyOpen ? '▾' : '▸'}
          </span>
        </button>

        <AnimatePresence initial={false}>
          {historyOpen ? (
            <motion.div
              key="history"
              initial={prefersReduced ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={prefersReduced ? undefined : { height: 0, opacity: 0 }}
              transition={
                prefersReduced ? { duration: 0 } : { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
              }
              className="overflow-hidden"
            >
              <ul className="mt-1.5 max-h-[7.5rem] list-none space-y-0.5 overflow-y-auto overscroll-contain p-0 pr-0.5">
                {history.length === 0 ? (
                  <li className="py-3 text-center font-body text-xs text-verdigris/55">
                    No notes yet.
                  </li>
                ) : (
                  history.map((note) => {
                    const id = note.id;
                    if (id == null) return null;
                    const preview =
                      note.content.trim().slice(0, 40) || '(empty note)';
                    const active = id === activeId;
                    return (
                      <li key={id}>
                        <div
                          className={[
                            'group flex items-center gap-1 rounded-md px-1.5 py-1.5 transition-colors',
                            active ? 'bg-deep/50' : 'hover:bg-deep/35',
                          ].join(' ')}
                        >
                          <button
                            type="button"
                            onClick={() => void openNote(note)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <span
                              className={[
                                'block truncate font-body text-xs',
                                active ? 'text-parchment' : 'text-parchment/80',
                              ].join(' ')}
                            >
                              {preview}
                              {note.content.trim().length > 40 ? '…' : ''}
                            </span>
                            <span className="mt-0.5 block font-body text-[0.6rem] text-verdigris/55">
                              {formatRelativeTime(note.updatedAt)}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void onDeleteHistory(id)}
                            aria-label="Delete note"
                            className="shrink-0 rounded px-1.5 py-0.5 font-body text-xs text-verdigris/40 opacity-100 transition-opacity hover:text-brass/90 sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            ×
                          </button>
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}

function SaveIndicator({
  state,
  prefersReduced,
}: {
  state: SaveState;
  prefersReduced: boolean;
}) {
  let label = '';
  if (state === 'saving' || state === 'dirty') label = 'Saving…';
  if (state === 'saved') label = 'Saved';

  return (
    <div className="min-w-[3.5rem] text-right" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        {label ? (
          <motion.span
            key={label}
            initial={prefersReduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReduced ? undefined : { opacity: 0 }}
            transition={prefersReduced ? { duration: 0 } : { duration: 0.35 }}
            className="font-body text-[0.65rem] uppercase tracking-[0.16em] text-verdigris/70"
          >
            {label}
          </motion.span>
        ) : (
          <span className="inline-block h-4" />
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotesWidget;

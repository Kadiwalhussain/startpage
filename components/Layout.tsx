import { NotesWidget } from './NotesWidget';
import { OrbitRing } from './OrbitRing';
import { QuoteCard } from './QuoteCard';
import { TaskWidget } from './TaskWidget';

/**
 * ChronoTab page chrome.
 *
 * Desktop (≥1024px): Orbit Ring dominates the upper ~65–70vh with generous
 * air around it. Below, QuoteCard takes a wider column (read-only, needs line
 * length); TaskWidget + NotesWidget stack in a narrower column. Stacking the
 * two capture widgets (rather than placing them side-by-side) keeps each
 * editor full-width of its column so inputs stay usable without squeezing two
 * interactive surfaces into half-width cells.
 *
 * Tablet (640–1023): ring stays the anchor; secondary widgets stack full-width.
 * Mobile (<640): ring shrinks but digits stay tabular/legible; stack order is
 * Quote → Tasks → Notes.
 */
export function Layout() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-deep text-parchment">
      {/*
        Hero band — instrument in space. Large vertical share + explicit
        bottom margin so secondary widgets never crowd the ring.
      */}
      <section
        className="relative flex min-h-[62vh] items-center justify-center px-4 pb-10 pt-8 sm:min-h-[66vh] sm:px-8 sm:pb-14 sm:pt-10 lg:min-h-[70vh] lg:pb-16 lg:pt-12"
        aria-label="Year orbit"
      >
        <OrbitRing />
      </section>

      {/* Secondary band — quiet, subordinate, responsive */}
      <section
        className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 sm:px-6 sm:pb-12 lg:px-8 lg:pb-14"
        aria-label="Secondary panels"
      >
        <div
          className="
            flex flex-col gap-5
            md:gap-6
            lg:grid lg:grid-cols-12 lg:items-start lg:gap-8
          "
        >
          {/* Quote: wider on desktop for comfortable reading measure */}
          <div className="w-full lg:col-span-7" data-mount="quote-card">
            <QuoteCard />
          </div>

          {/*
            Tasks + Notes stacked (not side-by-side): both are interactive
            capture UIs of similar visual weight; a vertical stack preserves
            full column width for inputs and avoids a cramped dual-editor row.
          */}
          <div className="flex w-full flex-col gap-5 md:gap-6 lg:col-span-5">
            <div data-mount="task-widget">
              <TaskWidget />
            </div>
            <div data-mount="notes-widget">
              <NotesWidget />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Layout;

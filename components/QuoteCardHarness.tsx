import { QuoteCard } from './QuoteCard';

/**
 * Temporary isolation harness for visual verification of QuoteCard.
 * Not wired into Layout — Prompt 7 mounts the card into the reserved slot.
 *
 * Usage: temporarily render `<QuoteCardHarness />` from App.tsx, or import
 * QuoteCard directly with a fixed `quote` prop in tests.
 */
export function QuoteCardHarness() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-deep p-6">
      <QuoteCard />
    </div>
  );
}

export default QuoteCardHarness;

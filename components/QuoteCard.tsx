import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useHourlyQuote } from '../hooks/useHourlyQuote';
import type { Quote } from '../data/quotes';

export type QuoteCardProps = {
  /**
   * Optional override for isolation tests / Storybook-style harnesses.
   * When omitted, the card uses `useHourlyQuote()`.
   */
  quote?: Quote;
};

/**
 * Quiet secondary plaque — serif quote, brass hairline, verdigris attribution.
 * Visually subordinate to the Orbit Ring; hourly change is a soft cross-fade.
 */
export function QuoteCard({ quote: quoteOverride }: QuoteCardProps) {
  const hourly = useHourlyQuote();
  const quote = quoteOverride ?? hourly.quote;
  const prefersReduced = useReducedMotion();

  return (
    <figure
      className="relative w-full rounded-lg border border-verdigris/20 bg-panel px-5 py-5 sm:px-6 sm:py-6"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={quote.id}
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReduced ? undefined : { opacity: 0 }}
          transition={
            prefersReduced
              ? { duration: 0 }
              : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
          }
        >
          <blockquote className="font-body text-base leading-relaxed text-parchment sm:text-lg sm:leading-relaxed">
            <span className="text-brass/70" aria-hidden>
              “
            </span>
            {quote.text}
            <span className="text-brass/70" aria-hidden>
              ”
            </span>
          </blockquote>

          {/* Engraved-plaque hairline */}
          <div
            className="my-4 h-px w-12 bg-brass/70 sm:my-5"
            role="presentation"
          />

          <figcaption className="font-body text-[0.7rem] uppercase tracking-[0.22em] text-verdigris sm:text-xs sm:tracking-[0.26em]">
            <span className="text-verdigris">{quote.author}</span>
            {quote.role ? (
              <span className="mt-1 block normal-case tracking-wide text-verdigris/70">
                {quote.role}
              </span>
            ) : null}
          </figcaption>
        </motion.div>
      </AnimatePresence>
    </figure>
  );
}

export default QuoteCard;

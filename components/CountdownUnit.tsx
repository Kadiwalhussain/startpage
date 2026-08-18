import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

type CountdownUnitProps = {
  /** Whole non-negative integer to display */
  value: number;
  /** Minimum digit width (pad with zeros) */
  pad: number;
  /** Quiet label under the digits, e.g. "DAYS" */
  label: string;
};

/**
 * One countdown column: tabular digits with a subtle vertical slide on change.
 * Memoized so only units whose `value` changed re-render on each tick.
 */
function CountdownUnitInner({ value, pad, label }: CountdownUnitProps) {
  const reducedMotion = usePrefersReducedMotion();
  const display = String(Math.max(0, value)).padStart(pad, '0');

  return (
    <div className="flex min-w-[2.75rem] flex-col items-center sm:min-w-[3.5rem] md:min-w-[4.25rem] lg:min-w-[4.75rem]">
      <div
        className="relative h-[1.15em] overflow-hidden font-display text-[1.65rem] font-medium tabular-nums tracking-tight text-parchment sm:text-4xl md:text-5xl lg:text-6xl"
        aria-label={`${value} ${label.toLowerCase()}`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={display}
            className="block will-change-transform"
            initial={reducedMotion ? false : { y: '45%', opacity: 0.35 }}
            animate={{ y: '0%', opacity: 1 }}
            exit={
              reducedMotion
                ? undefined
                : { y: '-45%', opacity: 0, position: 'absolute', left: 0, right: 0 }
            }
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
            }
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-1.5 font-body text-[0.55rem] font-medium uppercase tracking-[0.24em] text-verdigris sm:mt-2 sm:text-[0.65rem] sm:tracking-[0.32em]">
        {label}
      </span>
    </div>
  );
}

export const CountdownUnit = memo(CountdownUnitInner);
export default CountdownUnit;

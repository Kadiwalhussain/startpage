import { motion, useReducedMotion } from 'framer-motion';
import { memo, useMemo } from 'react';
import { useYearCountdown } from '../hooks/useYearCountdown';
import { CountdownUnit } from './CountdownUnit';

/** SVG geometry — unitless viewBox coords */
const VB = 400;
const CX = 200;
const CY = 200;
/** Main orbit radius */
const R = 158;
/** Tick geometry */
const TICK_INNER = R - 10;
const TICK_OUTER = R + 14;
const MARKER_R = 7;

const BRASS = '#C9A227';
const BRASS_SOFT = '#D4AF37';
const VERDIGRIS = '#4A7C7C';

/**
 * Month-boundary angles as fractions of the year [0, 1).
 *
 * SIMPLIFICATION: ticks are evenly spaced at n/12 of the circle (each month
 * treated as equal length). True calendar month starts fall at uneven
 * day-of-year fractions; even 1/12 spacing is intentional for a clean
 * instrument face.
 */
const MONTH_TICK_FRACTIONS = Array.from({ length: 12 }, (_, i) => i / 12);

function polar(fraction: number, radius: number): { x: number; y: number } {
  // Year progresses clockwise from 12 o'clock (top).
  const angleRad = fraction * 2 * Math.PI - Math.PI / 2;
  return {
    x: CX + radius * Math.cos(angleRad),
    y: CY + radius * Math.sin(angleRad),
  };
}

function tickLine(fraction: number) {
  const a = polar(fraction, TICK_INNER);
  const b = polar(fraction, TICK_OUTER);
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
}

type RingFaceProps = {
  progress: number;
  prefersReduced: boolean;
};

/** SVG ring + marker — only re-renders when progress changes meaningfully. */
const RingFace = memo(function RingFace({ progress, prefersReduced }: RingFaceProps) {
  const circumference = 2 * Math.PI * R;
  const progressFraction = progress / 100;
  const dashOffset = circumference * (1 - progressFraction);
  const markerRotate = progressFraction * 360;

  const ticks = useMemo(
    () => MONTH_TICK_FRACTIONS.map((f) => ({ fraction: f, ...tickLine(f) })),
    [],
  );

  return (
    <svg
      viewBox={`0 0 ${VB} ${VB}`}
      className="h-full w-full overflow-visible"
      aria-hidden
    >
      <defs>
        <filter id="orbit-soft-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke={VERDIGRIS}
        strokeWidth={2.5}
        strokeOpacity={0.35}
      />

      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke={BRASS}
        strokeWidth={3.25}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${CX} ${CY})`}
        filter="url(#orbit-soft-glow)"
        style={{
          transition: prefersReduced ? undefined : 'stroke-dashoffset 0.85s linear',
        }}
      />

      {ticks.map((t) => (
        <line
          key={t.fraction}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke={BRASS}
          strokeWidth={t.fraction === 0 ? 2.4 : 1.6}
          strokeLinecap="round"
          strokeOpacity={t.fraction === 0 ? 0.95 : 0.72}
        />
      ))}

      <motion.g
        initial={false}
        animate={{ rotate: markerRotate }}
        transition={
          prefersReduced
            ? { duration: 0 }
            : { type: 'tween', ease: 'linear', duration: 0.9 }
        }
        transformTemplate={({ rotate }) => `rotate(${rotate ?? 0} ${CX} ${CY})`}
      >
        <circle
          cx={CX}
          cy={CY - R}
          r={MARKER_R}
          fill={BRASS_SOFT}
          stroke={BRASS}
          strokeWidth={1.25}
          filter="url(#orbit-soft-glow)"
        />
        <circle
          cx={CX}
          cy={CY - R}
          r={MARKER_R * 0.35}
          fill="#0B0E1A"
          fillOpacity={0.35}
        />
      </motion.g>
    </svg>
  );
});

/**
 * Orbit Ring hero — the year's path as a single living instrument.
 *
 * Performance: `useYearCountdown` lives here only. Sibling widgets (quote,
 * tasks, notes) do not subscribe to the 1Hz tick. Digit columns are memoized
 * so stable units skip work on each second.
 */
export function OrbitRing() {
  const {
    days,
    hours,
    minutes,
    seconds,
    percentComplete,
    dayNumber,
    totalDaysInYear,
    year,
  } = useYearCountdown();

  const prefersReduced = useReducedMotion();
  const progress = Math.min(100, Math.max(0, percentComplete));

  return (
    <div
      className="relative mx-auto flex w-full max-w-[min(94vw,680px)] flex-col items-center justify-center lg:max-w-[min(92vw,720px)]"
      role="img"
      aria-label={`Year ${year} orbit: ${progress.toFixed(1)} percent complete. ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds remaining. Day ${dayNumber} of ${totalDaysInYear}.`}
    >
      {/* Ambient brass glow — restrained */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[8%] rounded-full opacity-70"
        style={{
          background:
            'radial-gradient(circle, rgba(201,162,39,0.14) 0%, rgba(201,162,39,0.05) 38%, rgba(11,14,26,0) 68%)',
          filter: 'blur(2px)',
        }}
      />

      <div className="relative aspect-square w-full">
        <RingFace progress={progress} prefersReduced={!!prefersReduced} />

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-6">
          <p className="mb-2 font-body text-[0.6rem] uppercase tracking-[0.32em] text-verdigris sm:mb-3 sm:text-[0.65rem] sm:tracking-[0.35em] md:mb-4 md:text-xs">
            Year {year}
          </p>

          <div className="flex flex-wrap items-start justify-center gap-1.5 sm:gap-3 md:gap-5">
            <CountdownUnit value={days} pad={3} label="Days" />
            <Separator />
            <CountdownUnit value={hours} pad={2} label="Hours" />
            <Separator />
            <CountdownUnit value={minutes} pad={2} label="Min" />
            <Separator />
            <CountdownUnit value={seconds} pad={2} label="Sec" />
          </div>

          <p className="mt-3 font-body text-[0.6rem] tracking-wide text-verdigris/80 sm:mt-4 sm:text-[0.65rem] md:mt-5 md:text-xs">
            Day {dayNumber}
            <span className="mx-1.5 text-verdigris/40">·</span>
            {totalDaysInYear}
          </p>
        </div>
      </div>
    </div>
  );
}

function Separator() {
  return (
    <span
      aria-hidden
      className="mt-0.5 select-none font-display text-xl font-light text-brass/40 sm:mt-1 sm:text-3xl md:text-4xl"
    >
      :
    </span>
  );
}

export default OrbitRing;

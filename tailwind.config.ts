import type { Config } from 'tailwindcss';

/**
 * ChronoTab design tokens — observatory / antique astronomical-instrument palette.
 * Use as: bg-deep, bg-panel, text-brass, text-parchment, border-verdigris, font-display, font-body
 */
const config: Config = {
  content: [
    './entrypoints/**/*.{html,ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        deep: '#0B0E1A',
        panel: '#12162A',
        brass: '#C9A227',
        'brass-soft': '#D4AF37',
        parchment: '#EDE6D6',
        verdigris: '#4A7C7C',
      },
      fontFamily: {
        // Precision-instrument numerals / wordmark
        display: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
        // Literary-almanac body / labels / quotes
        body: ['Fraunces', 'ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;

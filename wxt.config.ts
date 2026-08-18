import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'ChronoTab',
    short_name: 'ChronoTab',
    description:
      'Replace your new tab with a living year instrument — the Orbit Ring — plus a quiet quote, tasks, and notes.',
    version: '1.0.0',
    // Icons are auto-picked from public/icon by WXT; keep explicit for clarity.
    icons: {
      '16': 'icon/16.png',
      '32': 'icon/32.png',
      '48': 'icon/48.png',
      '96': 'icon/96.png',
      '128': 'icon/128.png',
    },
  },
});

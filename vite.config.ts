/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// VITE_BASE lets the same build run at "/" locally and at "/BugBounty/" on GitHub Pages.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    // `npm run perf` runs the measurement suite instead of the normal tests.
    include: process.env.PERF ? ['src/perf/**/*.perf.tsx'] : ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/polyfills.ts', './src/test/setup.ts'],
    globals: true,
    css: false,
    restoreMocks: true,
  },
});

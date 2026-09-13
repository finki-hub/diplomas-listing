import { resolve } from 'node:path';
import solid from 'vite-plugin-solid';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
    conditions: ['development', 'browser'],
  },
  test: {
    environment: 'node',
  },
});

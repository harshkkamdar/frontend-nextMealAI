import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Note: @vitejs/plugin-react is installed but not wired into this config.
// Pure-TS util tests (e.g. src/lib/macros.ts) run fine without it.
// When adding React Testing Library component tests (.test.tsx), either
// rename this file to vitest.config.mts and import the plugin there, or
// create a second config specifically for component tests.
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

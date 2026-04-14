import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// ESM config so @vitejs/plugin-react (ESM-only) can load.
// This is the authoritative vitest config — covers both pure-TS util tests
// (src/lib/__tests__/**/*.test.ts) and RTL component tests
// (src/components/**/__tests__/**/*.test.tsx). The legacy CJS vitest.config.ts
// is retained as a no-op rollback safety net and should be removed once this
// config is proven green in CI.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/__tests__/**/*.test.ts',
      'src/**/__tests__/**/*.test.tsx',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

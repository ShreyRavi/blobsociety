import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
// vitest/config re-exports all vite config options

export default defineConfig({
  base: '/blobsociety/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    testTimeout: 30000,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/engine/**', 'src/systems/**'],
      exclude: ['src/engine/SimEngine.ts'],
      thresholds: { lines: 80, functions: 80 },
      reporter: ['text', 'lcov'],
    },
  },
})

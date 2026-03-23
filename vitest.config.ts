import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    // Mock Electron and Node built-ins that can't run in pure vitest
    alias: {
      electron: new URL('./src/__mocks__/electron.ts', import.meta.url).pathname,
    },
  },
})

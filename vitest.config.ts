import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/unit/**/*.spec.ts', 'src/tests/integration/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/policy/**/*.ts', 'src/lib/money.ts'],
      exclude: ['src/lib/policy/index.ts', 'src/lib/policy/types.ts', 'src/lib/policy/compiler.ts'],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

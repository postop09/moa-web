import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'app/**/*.test.{ts,tsx}',
      'src/**/*.test.{ts,tsx}',
      'scripts/**/*.test.ts',
      'proxy.test.ts',
    ],
    // 일부 순수 함수(buildDailyExpenses 등)는 로컬 타임존 기준으로 날짜 경계를
    // 계산한다. CI 러너(GitHub Actions)는 기본 TZ가 UTC라 KST 기준으로 짠
    // 테스트가 로컬에서는 통과하고 CI에서만 깨질 수 있어 타임존을 고정한다.
    env: {
      TZ: 'Asia/Seoul',
    },
  },
});

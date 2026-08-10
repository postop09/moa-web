import withPWAInit from '@ducanh2912/next-pwa';
import type { NextConfig } from 'next';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  // next-pwa는 webpack 기반. Next 16 기본 Turbopack과 병행 시 build는 --webpack 사용.
  turbopack: {},
};

export default withPWA(nextConfig);

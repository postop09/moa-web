import withPWAInit from '@ducanh2912/next-pwa';
import type { NextConfig } from 'next';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  // 스플래시(21장)는 iOS가 시작 이미지를 OS 레벨에서 따로 캐시하므로 프리캐시가 낭비고,
  // 로고 원본(icons/icon_logo_*.png)은 MoaLogo가 next/image로 쓰기 때문에 실제 요청이
  // /_next/image?url=... 로 나가 원본 자체는 프리캐시할 필요가 없다.
  // 기본값('!noprecache/**/*')은 배열을 지정하면 덮어써지므로 함께 유지한다.
  publicExcludes: [
    '!noprecache/**/*',
    '!splash/**/*',
    '!icons/icon_logo_*.png',
  ],
});

const nextConfig: NextConfig = {
  // next-pwa는 webpack 기반. Next 16 기본 Turbopack과 병행 시 build는 --webpack 사용.
  turbopack: {},
};

export default withPWA(nextConfig);

import type { Metadata, Viewport } from 'next';
import { type ReactNode } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

import { Providers } from '@/app/providers';
import {
  defaultTitle,
  description,
  getAppleSplashStartupImages,
  getBaseOpenGraph,
  getSiteUrl,
  getWebSiteJsonLd,
  keywords,
  ogImage,
  siteName,
  titleTemplate,
} from '@/shared/config';
// Pretendard를 npm 패키지로 self-host한다 — 이 앱은 한글 전용 PWA라
// next/font/google(Geist 등 latin 서브셋)로는 본문 한글이 전부 시스템
// 폰트로 폴백되고, 외부 폰트 CDN은 서비스워커 오프라인 캐싱과 상성이
// 나쁘다. 웹팩이 woff2를 자체 오리진으로 번들링해 두 문제를 함께 해결한다.
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import '@/shared/styles/globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: defaultTitle,
    template: titleTemplate,
  },
  verification: {
    google: 'b55ycs06tKKgwxSN4_bYDPrYASRfPiyUR_Q-NOl642E',
    other: {
      'naver-site-verification': '380ba16c8c9016795ae72ecb2dc46a807c9ac787',
    },
  },
  description,
  applicationName: siteName,
  keywords,
  category: 'finance',
  alternates: {
    canonical: '/',
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '모아(Moa)',
    startupImage: getAppleSplashStartupImages(),
  },
  openGraph: {
    ...getBaseOpenGraph(),
    title: defaultTitle,
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description,
    images: [ogImage.url],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#f4f6f8',
  width: 'device-width',
  initialScale: 1,
};

type Props = {
  children: ReactNode;
};

const RootLayout = ({ children }: Props) => {
  const jsonLd = getWebSiteJsonLd();

  return (
    <html lang="ko" style={{ background: '#f4f6f8' }}>
      <body style={{ background: '#f4f6f8' }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
        <Providers>
          {children}
          <SpeedInsights />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;

import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import { type ReactNode } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

import { Providers } from '@/app/providers';
import {
  defaultTitle,
  description,
  getBaseOpenGraph,
  getSiteUrl,
  getWebSiteJsonLd,
  keywords,
  ogImage,
  siteName,
  titleTemplate,
} from '@/shared/config';
import '@/shared/styles/globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument',
  subsets: ['latin'],
  weight: '400',
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: defaultTitle,
    template: titleTemplate,
  },
  verification: {
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
    startupImage: [
      {
        url: '/splash/apple-splash-1290-2796.png',
        media:
          '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash/apple-splash-1284-2778.png',
        media:
          '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash/apple-splash-1179-2556.png',
        media:
          '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash/apple-splash-1170-2532.png',
        media:
          '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/splash/apple-splash-1125-2436.png',
        media:
          '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
    ],
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
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
      style={{ background: '#f4f6f8' }}
    >
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

import type { Metadata } from 'next';

import { WelcomePage } from '@/pages/welcome';
import { getWebApplicationJsonLd } from '@/shared/config';

export const metadata: Metadata = {
  title: '소개',
  alternates: {
    canonical: '/welcome',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    url: '/welcome',
  },
};

const WelcomeRoutePage = () => {
  const jsonLd = getWebApplicationJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <WelcomePage />
    </>
  );
};

export default WelcomeRoutePage;

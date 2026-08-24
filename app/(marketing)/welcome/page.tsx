import type { Metadata } from 'next';

import { WelcomePage } from '@/pages/welcome';
import { getBaseOpenGraph, getWebApplicationJsonLd } from '@/shared/config';

export const metadata: Metadata = {
  title: '그래프로 보는 가계부',
  description:
    '가계부 모아(Moa)는 수입·지출·저축을 그래프로 정리해 보여줍니다. 설치 없이 브라우저에서 바로 쓰고, 가족과 하나의 가계부를 함께 관리하세요.',
  alternates: {
    canonical: '/welcome',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    ...getBaseOpenGraph(),
    url: '/welcome',
    title: '모아(Moa) — 그래프로 보는 가계부',
    description:
      '수입·지출·저축을 그래프로 정리하는 가계부. 설치 없이 브라우저에서 바로, 가족과 함께 쓸 수 있습니다.',
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

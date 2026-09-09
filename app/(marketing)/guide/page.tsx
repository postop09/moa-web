import type { Metadata } from 'next';

import { getGuideCollectionJsonLd, GuideListPage } from '@/pages/guide';
import { getBaseOpenGraph } from '@/shared/config';

export const metadata: Metadata = {
  title: '가이드 — 공유 가계부 사용하기',
  description:
    '가족, 커플과 공유 가계부를 시작하고 함께 쓰는 방법을 정리한 모아(Moa) 가이드입니다.',
  alternates: {
    canonical: '/guide',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    ...getBaseOpenGraph(),
    url: '/guide',
    title: '가이드 — 공유 가계부 사용하기 | 모아',
  },
};

const GuideRoutePage = () => {
  const jsonLd = getGuideCollectionJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <GuideListPage />
    </>
  );
};

export default GuideRoutePage;

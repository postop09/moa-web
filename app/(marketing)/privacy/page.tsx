import type { Metadata } from 'next';

import { getBaseOpenGraph } from '@/shared/config';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description:
    '모아(Moa)가 수집하는 개인정보 항목과 처리 목적, 보유 기간, 이용자의 권리 행사 방법을 안내합니다.',
  alternates: {
    canonical: '/privacy',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    ...getBaseOpenGraph(),
    url: '/privacy',
    title: '개인정보처리방침 | 모아',
  },
};

export { PrivacyPage as default } from '@/pages/legal';

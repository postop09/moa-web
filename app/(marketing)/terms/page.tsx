import type { Metadata } from 'next';

import { getBaseOpenGraph } from '@/shared/config';

export const metadata: Metadata = {
  title: '이용약관',
  description:
    '모아(Moa) 서비스의 이용 조건과 절차, 운영자와 이용자의 권리 및 의무를 안내합니다.',
  alternates: {
    canonical: '/terms',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    ...getBaseOpenGraph(),
    url: '/terms',
    title: '이용약관 | 모아',
  },
};

export { TermsPage as default } from '@/pages/legal';

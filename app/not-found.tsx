import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없습니다',
};

export { NotFoundPage as default } from '@/pages/errorFallback';

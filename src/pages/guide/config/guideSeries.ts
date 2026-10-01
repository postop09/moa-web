import type { GuideSeries } from './guide';

export const GUIDE_SERIES: GuideSeries[] = [
  {
    id: 'getting-started',
    title: '모아 시작하기',
    description:
      '모아를 휴대폰 홈 화면에 앱처럼 설치하고 빠르게 여는 방법을 안내합니다.',
  },
  {
    id: 'shared-ledger',
    title: '공유 가계부 사용하기',
    description:
      '가족이나 커플과 하나의 가계부를 함께 쓰는 방법을 초대부터 권한, 기록 구분까지 순서대로 안내합니다.',
  },
];

export const getGuideSeriesById = (id: string): GuideSeries | undefined =>
  GUIDE_SERIES.find((series) => series.id === id);

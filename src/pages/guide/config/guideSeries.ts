import type { GuideSeries } from './guide';

export const GUIDE_SERIES: GuideSeries[] = [
  {
    id: 'shared-ledger',
    title: '공유 가계부 사용하기',
    description:
      '가족이나 커플과 하나의 가계부를 함께 쓰는 방법을 초대부터 권한, 기록 구분까지 순서대로 안내합니다.',
  },
];

export const getGuideSeriesById = (id: string): GuideSeries | undefined =>
  GUIDE_SERIES.find((series) => series.id === id);

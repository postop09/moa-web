export type Feature = {
  id: string;
  title: string;
  description: string;
};

export const FEATURES: Feature[] = [
  {
    id: 'types',
    title: '수입·지출·저축',
    description:
      '거래를 세 가지로 나눠 잔액(수입 − 지출 − 저축)을 분명히 합니다.',
  },
  {
    id: 'budget',
    title: '카테고리별 예산',
    description: '식비·교통비처럼 카테고리마다 예산을 두고 사용률을 봅니다.',
  },
  {
    id: 'household',
    title: '함께 쓰는 가계부',
    description:
      '초대 링크 한 번으로 부르고 카테고리·예산까지 같이 관리합니다.',
  },
  {
    id: 'charts',
    title: '그래프로 보는 통계',
    description: '한 달의 흐름을 다양한 차트로 한눈에 파악합니다.',
  },
];

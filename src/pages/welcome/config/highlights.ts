export type Highlight = {
  id: string;
  title: string;
  description: string;
  href: string;
};

export const HIGHLIGHTS: Highlight[] = [
  {
    id: 'ledger',
    title: '가계부',
    description: '수입·지출·저축을 적으면 남은 예산이 바로 보입니다.',
    href: '#ledger',
  },
  {
    id: 'calendar',
    title: '달력',
    description: '일정과 그날의 지출을 한 화면에서 확인합니다.',
    href: '#calendar',
  },
  {
    id: 'pwa',
    title: '설치 없는 웹 앱',
    description: '홈 화면에 추가하면 앱처럼 바로 실행됩니다.',
    href: '#pwa',
  },
];

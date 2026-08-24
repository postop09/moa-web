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
    description: '월 수입·지출·저축을 적으며 남은 예산과 내 자산을 관리합니다.',
    href: '#ledger',
  },
  {
    id: 'share',
    title: '공유 가계부',
    description: '가족·친구·연인을 초대해, 한 가계부를 같이 씁니다.',
    href: '#share',
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

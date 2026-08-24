export type Fact = {
  id: string;
  value: string;
  label: string;
};

export const FACTS: Fact[] = [
  {
    id: 'price',
    value: '0원',
    label: '무료로 시작',
  },
  {
    id: 'install',
    value: '없음',
    label: '앱 설치',
  },
  {
    id: 'screens',
    value: '모든 기기',
    label: '화면 지원',
  },
];

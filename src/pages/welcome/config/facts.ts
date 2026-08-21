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
    value: '0MB',
    label: '앱 설치 용량',
  },
  {
    id: 'screens',
    value: '2가지',
    label: 'PC·모바일 화면',
  },
  {
    id: 'account',
    value: '1개',
    label: '계정으로 공유',
  },
];

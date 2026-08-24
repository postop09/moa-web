export type FooterLink = {
  label: string;
  href: string;
};

export type FooterLinkGroup = {
  id: string;
  title: string;
  links: FooterLink[];
};

export const FOOTER_LINK_GROUPS: FooterLinkGroup[] = [
  {
    id: 'service',
    title: '서비스',
    links: [
      { label: '모아 소개', href: '/welcome' },
      { label: '시작하기', href: '/login' },
    ],
  },
  {
    id: 'policy',
    title: '정책',
    links: [
      { label: '개인정보처리방침', href: '/privacy' },
      { label: '이용약관', href: '/terms' },
    ],
  },
];

export type WelcomeSection = {
  id: string;
  label: string;
};

export type WelcomeNavItem =
  | { type: 'anchor'; id: string; label: string }
  | { type: 'route'; href: string; label: string };

export const WELCOME_NAV_ITEMS: WelcomeNavItem[] = [
  { type: 'anchor', id: 'ledger', label: '가계부' },
  { type: 'anchor', id: 'share', label: '공유' },
  { type: 'anchor', id: 'calendar', label: '달력' },
  { type: 'anchor', id: 'pwa', label: '웹 앱' },
  { type: 'route', href: '/guide', label: '가이드' },
];

export const WELCOME_NAV_SECTIONS: WelcomeSection[] = WELCOME_NAV_ITEMS.filter(
  (item): item is Extract<WelcomeNavItem, { type: 'anchor' }> =>
    item.type === 'anchor',
).map((item) => ({ id: item.id, label: item.label }));

export const WELCOME_SECTION_IDS = {
  highlights: 'highlights',
  ledger: 'ledger',
  share: 'share',
  features: 'features',
  calendar: 'calendar',
  pwa: 'pwa',
  facts: 'facts',
  cta: 'cta',
} as const;

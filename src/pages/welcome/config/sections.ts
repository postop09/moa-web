export type WelcomeSection = {
  id: string;
  label: string;
};

export const WELCOME_NAV_SECTIONS: WelcomeSection[] = [
  { id: 'ledger', label: '가계부' },
  { id: 'calendar', label: '달력' },
  { id: 'pwa', label: '웹 앱' },
];

export const WELCOME_SECTION_IDS = {
  highlights: 'highlights',
  ledger: 'ledger',
  features: 'features',
  calendar: 'calendar',
  pwa: 'pwa',
  facts: 'facts',
  cta: 'cta',
} as const;

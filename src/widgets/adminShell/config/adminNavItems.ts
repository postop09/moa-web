export type AdminNavItem = {
  id: string;
  label: string;
  /** href 가 없으면 아직 열리지 않은 2차 범위 메뉴다. */
  href?: string;
};

export const adminNavItems: AdminNavItem[] = [
  { id: 'inquiries', label: '문의 관리', href: '/admin/inquiries' },
  { id: 'faq', label: 'FAQ 관리' },
  { id: 'templates', label: '답변 템플릿' },
  { id: 'stats', label: '통계' },
];

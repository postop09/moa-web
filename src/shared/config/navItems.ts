export type NavItemId = 'home' | 'stats' | 'calendar' | 'settings';

export type NavItem = {
  id: NavItemId;
  href: string;
  label: string;
};

export const writeHref = '/write';

export const navItems: NavItem[] = [
  { id: 'home', href: '/', label: '홈' },
  { id: 'stats', href: '/stats', label: '통계' },
  { id: 'calendar', href: '/calendar', label: '달력' },
  { id: 'settings', href: '/settings', label: '설정' },
];

export const isNavItemActive = (href: string, pathname: string) => {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

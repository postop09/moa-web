'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { isNavItemActive, navItems } from '@/shared/config';

import { navIcons } from './navIcons';
import styles from './appShell.module.css';

export const BottomTabBar = () => {
  const pathname = usePathname() ?? '';

  return (
    <nav className={styles.tabBar} aria-label="주요 메뉴">
      {navItems.map((item) => {
        const Icon = navIcons[item.id];
        const isActive = isNavItemActive(item.href, pathname);

        return (
          <Link
            key={item.id}
            href={item.href}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
          >
            <Icon className={styles.icon} size={22} strokeWidth={1.75} />
            <span className={styles.bottomLabel}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

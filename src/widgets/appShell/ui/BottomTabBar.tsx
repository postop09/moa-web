'use client';

import Link from 'next/link';

import { isNavItemActive, navItems } from '@/shared/config';

import { usePendingHref } from '../model/usePendingHref';
import { navIcons } from './navIcons';
import styles from './appShell.module.css';

export const BottomTabBar = () => {
  const { pathname, pendingHref, onPendingClick } = usePendingHref();
  const activePath = pendingHref ?? pathname;

  return (
    <nav className={styles.tabBar} aria-label="주요 메뉴">
      {navItems.map((item) => {
        const Icon = navIcons[item.id];
        const isActive = isNavItemActive(item.href, activePath);

        return (
          <Link
            key={item.id}
            href={item.href}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
            onClick={onPendingClick(item.href)}
          >
            <Icon className={styles.icon} size={22} strokeWidth={1.75} />
            <span className={styles.label}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

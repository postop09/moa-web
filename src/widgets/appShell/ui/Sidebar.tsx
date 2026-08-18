'use client';

import Link from 'next/link';

import { isNavItemActive, navItems } from '@/shared/config';
import { MoaLogo } from '@/shared/ui';

import { usePendingHref } from '../model/usePendingHref';
import { navIcons } from './navIcons';
import styles from './appShell.module.css';

export const Sidebar = () => {
  const { pathname, pendingHref, onPendingClick } = usePendingHref();
  const activePath = pendingHref ?? pathname;

  return (
    <aside className={styles.sidebar}>
      <Link
        href="/"
        className={styles.brand}
        aria-label="Moa 홈"
        onClick={onPendingClick('/')}
      >
        <MoaLogo variant="black" size={40} priority /> 모아
      </Link>
      <nav className={styles.nav} aria-label="주요 메뉴">
        {navItems.map((item) => {
          const Icon = navIcons[item.id];
          const isActive = isNavItemActive(item.href, activePath);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`${styles.link} ${isActive ? styles.linkActive : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={onPendingClick(item.href)}
            >
              <Icon className={styles.icon} size={22} strokeWidth={1.75} />
              <span className={styles.label}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

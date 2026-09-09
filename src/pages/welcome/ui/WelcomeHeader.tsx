'use client';

import Link from 'next/link';

import { MoaLogo } from '@/shared/ui';

import { WELCOME_NAV_ITEMS, WELCOME_NAV_SECTIONS } from '../config/sections';
import { useSectionNav } from '../model/useSectionNav';
import { useSmoothScroll } from '../model/useSmoothScroll';
import styles from './welcome.module.css';

export const WelcomeHeader = () => {
  useSmoothScroll();
  const { activeId } = useSectionNav(WELCOME_NAV_SECTIONS);

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/welcome" className={styles.brand} aria-label="모아 소개">
          <MoaLogo variant="black" size={32} priority />
          모아
        </Link>
        <nav className={styles.localNav} aria-label="페이지 섹션">
          {WELCOME_NAV_ITEMS.map((item) => {
            if (item.type === 'route') {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={styles.localNavLink}
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`${styles.localNavLink} ${styles.localNavLinkAnchor} ${
                  activeId === item.id ? styles.localNavLinkActive : ''
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
        <Link href="/login" className={styles.headerCta}>
          시작하기
        </Link>
      </div>
    </header>
  );
};

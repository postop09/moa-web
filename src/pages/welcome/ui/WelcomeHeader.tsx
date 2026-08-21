'use client';

import Link from 'next/link';

import { MoaLogo } from '@/shared/ui';

import { WELCOME_NAV_SECTIONS } from '../config/sections';
import { useSectionNav } from '../model/useSectionNav';
import styles from './welcome.module.css';

export const WelcomeHeader = () => {
  const { activeId } = useSectionNav(WELCOME_NAV_SECTIONS);

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/welcome" className={styles.brand} aria-label="모아 소개">
          <MoaLogo variant="black" size={32} priority />
          모아
        </Link>
        <nav className={styles.localNav} aria-label="페이지 섹션">
          {WELCOME_NAV_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`${styles.localNavLink} ${
                activeId === section.id ? styles.localNavLinkActive : ''
              }`}
            >
              {section.label}
            </a>
          ))}
        </nav>
        <Link href="/login" className={styles.headerCta}>
          시작하기
        </Link>
      </div>
    </header>
  );
};

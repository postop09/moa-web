'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { useAdminPendingCount } from '@/features/adminInquiry';
import { isNavItemActive, siteName } from '@/shared/config';

import { adminNavItems } from '../config/adminNavItems';
import styles from './adminShell.module.css';

type Props = {
  children: ReactNode;
};

const BADGE_MAX = 99;

export const AdminShell = ({ children }: Props) => {
  const pathname = usePathname() ?? '';
  const { data: pendingCount } = useAdminPendingCount();
  const pending = pendingCount && pendingCount > 0 ? pendingCount : 0;

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <p className={styles.brand}>{`${siteName} 어드민`}</p>
        <nav aria-label="어드민 메뉴">
          <ul className={styles.list}>
            {adminNavItems.map((item) => {
              if (!item.href) {
                return (
                  <li key={item.id}>
                    <span
                      className={`${styles.item} ${styles.itemDisabled}`}
                      aria-disabled="true"
                    >
                      <span>{item.label}</span>
                      <span className={styles.soon}>준비 중</span>
                    </span>
                  </li>
                );
              }

              const isActive = isNavItemActive(item.href, pathname);
              const showBadge = item.id === 'inquiries' && pending > 0;

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={`${styles.item} ${styles.link} ${isActive ? styles.linkActive : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={
                      showBadge
                        ? `${item.label}, 미처리 ${pending}건`
                        : undefined
                    }
                  >
                    <span>{item.label}</span>
                    {showBadge ? (
                      <span className={styles.badge} aria-hidden="true">
                        {pending > BADGE_MAX ? `${BADGE_MAX}+` : pending}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
};

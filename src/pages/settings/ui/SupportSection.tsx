'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { useUnreadReplyCount } from '@/features/inquiry';

import styles from './settings.module.css';

export const SupportSection = () => {
  const { data: unreadCount = 0 } = useUnreadReplyCount();

  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>도움말</h2>
      </header>

      <Link href="/support" className={styles.linkRow}>
        <span className={styles.linkRowLabel}>고객센터</span>
        {unreadCount > 0 ? (
          <span className={styles.newBadge}>새 답변 {unreadCount}</span>
        ) : null}
        <ChevronRight size={20} strokeWidth={2} aria-hidden />
      </Link>
    </section>
  );
};

import Link from 'next/link';
import { type ReactNode } from 'react';

import styles from './tabsShell.module.css';

type Props = {
  children: ReactNode;
};

export const TabsShell = ({ children }: Props) => {
  return (
    <div className={styles.shell}>
      <div className={styles.content}>{children}</div>
      <nav className={styles.nav} aria-label="주요 메뉴">
        <Link className={styles.link} href="/">
          홈
        </Link>
        <Link className={styles.link} href="/calendar">
          캘린더
        </Link>
        <Link className={styles.link} href="/add">
          추가
        </Link>
        <Link className={styles.link} href="/statistics">
          통계
        </Link>
        <Link className={styles.link} href="/settings">
          설정
        </Link>
      </nav>
    </div>
  );
};

import Link from 'next/link';

import { MoaLogo } from '@/shared/ui';

import styles from './guide.module.css';

export const GuideHeader = () => {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/welcome" className={styles.brand}>
          <MoaLogo variant="black" size={28} alt="" priority />
          모아
        </Link>
        <Link href="/login" className={styles.headerCta}>
          시작하기
        </Link>
      </div>
    </header>
  );
};

import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

import styles from './pageHeader.module.css';

type Props = {
  title: string;
  onBack?: () => void;
  backHref?: string;
  right?: ReactNode;
};

export const PageHeader = ({ title, onBack, backHref, right }: Props) => {
  const icon = <ChevronLeft size={24} strokeWidth={2} aria-hidden />;

  return (
    <header className={styles.header}>
      {onBack ? (
        <button
          type="button"
          className={styles.back}
          aria-label="뒤로 가기"
          onClick={onBack}
        >
          {icon}
        </button>
      ) : backHref ? (
        <Link href={backHref} className={styles.back} aria-label="뒤로 가기">
          {icon}
        </Link>
      ) : null}
      <h1 className={styles.title}>{title}</h1>
      {right ? <div className={styles.right}>{right}</div> : null}
    </header>
  );
};

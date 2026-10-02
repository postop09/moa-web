import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

import styles from './pageHeader.module.css';

type Props = {
  title: string;
  onBack?: () => void;
  backHref?: string;
  /** 뒤로 가기를 막는다(제출 중 등). 포커스는 유지하고 aria-disabled 로 알린다. */
  backDisabled?: boolean;
  right?: ReactNode;
};

export const PageHeader = ({
  title,
  onBack,
  backHref,
  backDisabled = false,
  right,
}: Props) => {
  const icon = <ChevronLeft size={24} strokeWidth={2} aria-hidden />;

  return (
    <header className={styles.header}>
      {onBack ? (
        <button
          type="button"
          className={styles.back}
          aria-label="뒤로 가기"
          aria-disabled={backDisabled || undefined}
          onClick={backDisabled ? undefined : onBack}
        >
          {icon}
        </button>
      ) : backHref ? (
        <Link
          href={backHref}
          className={styles.back}
          aria-label="뒤로 가기"
          aria-disabled={backDisabled || undefined}
          onClick={backDisabled ? (event) => event.preventDefault() : undefined}
        >
          {icon}
        </Link>
      ) : null}
      <h1 className={styles.title}>{title}</h1>
      {right ? <div className={styles.right}>{right}</div> : null}
    </header>
  );
};

import Link from 'next/link';

import styles from './guide.module.css';

type Props = {
  currentTitle: string;
};

export const GuideBreadcrumb = ({ currentTitle }: Props) => {
  return (
    <nav aria-label="현재 위치">
      <ol className={styles.crumbs}>
        <li className={styles.crumbItem}>
          <Link href="/welcome" className={styles.crumbLink}>
            홈
          </Link>
          <span className={styles.crumbSeparator} aria-hidden="true">
            /
          </span>
        </li>
        <li className={styles.crumbItem}>
          <Link href="/guide" className={styles.crumbLink}>
            가이드
          </Link>
          <span className={styles.crumbSeparator} aria-hidden="true">
            /
          </span>
        </li>
        <li className={styles.crumbItem}>
          <span className={styles.crumbCurrent} aria-current="page">
            {currentTitle}
          </span>
        </li>
      </ol>
    </nav>
  );
};

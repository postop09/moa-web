import Link from 'next/link';

import type { GuideArticle } from '../config/guide';
import styles from './guide.module.css';

type Props = {
  previous?: GuideArticle;
  next?: GuideArticle;
};

export const GuideAdjacentNav = ({ previous, next }: Props) => {
  if (!previous && !next) {
    return null;
  }

  return (
    <nav className={styles.adjacentNav} aria-label="시리즈 글 이동">
      {previous ? (
        <Link href={`/guide/${previous.slug}`} className={styles.adjacentLink}>
          <span className={styles.adjacentDirection}>이전 글</span>
          <span className={styles.adjacentLinkTitle}>{previous.title}</span>
        </Link>
      ) : null}
      {next ? (
        <Link
          href={`/guide/${next.slug}`}
          className={`${styles.adjacentLink} ${styles.adjacentNext}`}
        >
          <span className={styles.adjacentDirection}>다음 글</span>
          <span className={styles.adjacentLinkTitle}>{next.title}</span>
        </Link>
      ) : null}
    </nav>
  );
};

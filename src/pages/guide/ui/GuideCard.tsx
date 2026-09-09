import Link from 'next/link';

import type { GuideArticle } from '../config/guide';
import { formatGuideDate } from '../lib/formatGuideDate';
import styles from './guide.module.css';

type Props = {
  article: GuideArticle;
};

export const GuideCard = ({ article }: Props) => {
  return (
    <li className={styles.card}>
      <span className={styles.cardBadge}>{article.order}편</span>
      <h3 className={styles.cardTitle}>
        <Link href={`/guide/${article.slug}`} className={styles.cardLink}>
          {article.title}
        </Link>
      </h3>
      <p className={styles.cardSummary}>{article.summary}</p>
      <time className={styles.cardDate} dateTime={article.publishedDate}>
        {formatGuideDate(article.publishedDate)}
      </time>
    </li>
  );
};

import Link from 'next/link';

import type { GuideArticle } from '../config/guide';
import styles from './guide.module.css';

type Props = {
  articles: GuideArticle[];
};

export const GuideRelatedArticles = ({ articles }: Props) => {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section className={styles.related} aria-labelledby="guide-related-title">
      <h2 id="guide-related-title" className={styles.relatedHeading}>
        같은 시리즈의 다른 글
      </h2>
      <ul className={styles.relatedList}>
        {articles.map((article) => (
          <li key={article.slug}>
            <Link
              href={`/guide/${article.slug}`}
              className={styles.relatedLink}
            >
              <span className={styles.relatedOrder}>{article.order}편</span>
              <span className={styles.relatedTitle}>{article.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

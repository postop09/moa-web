import type { GuideArticle, GuideSeries } from '../config/guide';
import { GuideCard } from './GuideCard';
import styles from './guide.module.css';

type Props = {
  series: GuideSeries;
  articles: GuideArticle[];
};

export const GuideSeriesBlock = ({ series, articles }: Props) => {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section
      className={styles.seriesBlock}
      aria-labelledby={`series-${series.id}-title`}
    >
      <h2 id={`series-${series.id}-title`} className={styles.seriesTitle}>
        {series.title}
      </h2>
      <p className={styles.seriesText}>{series.description}</p>
      <ul className={styles.cardGrid}>
        {articles.map((article) => (
          <GuideCard key={article.slug} article={article} />
        ))}
      </ul>
    </section>
  );
};

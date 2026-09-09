import type { GuideArticle } from '../config/guide';
import { getGuideSeriesById } from '../config/guideSeries';
import { formatGuideDate } from '../lib/formatGuideDate';
import { getAdjacentArticles, getRelatedArticles } from '../lib/guideArticles';
import { GuideAdjacentNav } from './GuideAdjacentNav';
import { GuideBlockView } from './GuideBlockView';
import { GuideBreadcrumb } from './GuideBreadcrumb';
import { GuideCta } from './GuideCta';
import { GuideHeader } from './GuideHeader';
import { GuideRelatedArticles } from './GuideRelatedArticles';
import { GuideToc } from './GuideToc';
import styles from './guide.module.css';

type Props = {
  article: GuideArticle;
};

export const GuideArticlePage = ({ article }: Props) => {
  const series = getGuideSeriesById(article.seriesId);
  const relatedArticles = getRelatedArticles(article);
  const { previous, next } = getAdjacentArticles(article);

  return (
    <div className={styles.page}>
      <GuideHeader />

      <main className={styles.main}>
        <article className={styles.article}>
          <GuideBreadcrumb currentTitle={article.title} />

          <h1 className={styles.title}>{article.title}</h1>

          <p className={styles.meta}>
            {series ? `${series.title} · ` : null}
            {article.order}편 ·{' '}
            <time dateTime={article.publishedDate}>
              {formatGuideDate(article.publishedDate)}
            </time>
            {article.updatedDate ? (
              <>
                {' '}
                · 최종 수정{' '}
                <time dateTime={article.updatedDate}>
                  {formatGuideDate(article.updatedDate)}
                </time>
              </>
            ) : null}
          </p>

          <p className={styles.summary}>{article.summary}</p>

          <GuideToc sections={article.sections} />

          {article.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className={styles.section}
              aria-labelledby={`${section.id}-title`}
            >
              <h2 id={`${section.id}-title`} className={styles.sectionTitle}>
                {section.title}
              </h2>
              {section.blocks.map((block, index) => (
                <GuideBlockView
                  key={`${section.id}-block-${index}`}
                  block={block}
                />
              ))}
            </section>
          ))}

          <GuideRelatedArticles articles={relatedArticles} />
          <GuideAdjacentNav previous={previous} next={next} />
          <GuideCta />
        </article>
      </main>
    </div>
  );
};

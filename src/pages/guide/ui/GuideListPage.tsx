import { GUIDE_ARTICLES } from '../config/articles';
import { GUIDE_SERIES } from '../config/guideSeries';
import { getArticlesBySeries } from '../lib/guideArticles';
import { GuideCta } from './GuideCta';
import { GuideHeader } from './GuideHeader';
import { GuideSeriesBlock } from './GuideSeriesBlock';
import styles from './guide.module.css';

export const GuideListPage = () => {
  return (
    <div className={`${styles.page} ${styles.pageWide}`}>
      <GuideHeader />

      <main className={styles.main}>
        <div className={styles.listInner}>
          <header className={styles.listHead}>
            <p className={styles.eyebrow}>가이드</p>
            <h1 className={styles.pageTitle}>가이드</h1>
            <p className={styles.pageLead}>
              가족, 커플과 공유 가계부를 시작하고 함께 쓰는 방법을 정리했습니다.
            </p>
          </header>

          {GUIDE_ARTICLES.length === 0 ? (
            <div className={styles.empty}>
              준비 중인 가이드가 곧 올라옵니다.
            </div>
          ) : (
            GUIDE_SERIES.map((series) => (
              <GuideSeriesBlock
                key={series.id}
                series={series}
                articles={getArticlesBySeries(series.id)}
              />
            ))
          )}

          <GuideCta />
        </div>
      </main>
    </div>
  );
};

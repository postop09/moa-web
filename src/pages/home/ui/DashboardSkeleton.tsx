import { Skeleton } from '@/shared/ui';

import styles from './home.module.css';

// 실제 카드 콘텐츠 높이에 맞춘 값 — 데이터 도착 시 레이아웃이 밀리지 않게 한다.
const SKELETON_HEIGHT = {
  chartTitle: '1.4rem',
  chart: '15rem',
  trend: '17.5rem',
  topSpendings: '12.5rem',
  recent: '12rem',
};

type Props = {
  height?: string;
};

export const CardSkeleton = ({ height = SKELETON_HEIGHT.chart }: Props) => (
  <section className={styles.card} aria-hidden="true">
    <Skeleton height={SKELETON_HEIGHT.chartTitle} width="6rem" />
    <Skeleton height={height} />
  </section>
);

export const RingCardSkeleton = () => (
  <div className={styles.ringCard} aria-hidden="true">
    <div className={styles.ringChart}>
      <Skeleton circle width="100%" height="100%" />
    </div>
    <div className={styles.ringBody}>
      <Skeleton height="0.8125rem" width="4rem" />
      <Skeleton height="1.0625rem" width="6rem" />
    </div>
  </div>
);

// 순수 장식(aria-hidden)이다 — 로딩 상태 안내는 DashboardSection/HouseholdGuard의 status 슬롯이 맡는다.
export const DashboardSkeleton = () => (
  <div className={styles.dashboard} aria-hidden="true">
    <section className={styles.header}>
      <div className={styles.budgetBlock}>
        <Skeleton height="0.875rem" width="12rem" />
        <Skeleton height="2.1rem" width="10rem" />
      </div>
      <div className={styles.stackBarBlock}>
        <div className={styles.legend}>
          <Skeleton height="1.2rem" width="5rem" />
          <Skeleton height="1.2rem" width="5rem" />
          <Skeleton height="1.2rem" width="5rem" />
          <Skeleton height="1.2rem" width="5rem" />
        </div>
        <Skeleton height="0.625rem" />
      </div>
    </section>

    <CardSkeleton />

    <div className={styles.grid}>
      <div className={styles.column}>
        <div className={styles.kpiGrid}>
          <RingCardSkeleton />
          <RingCardSkeleton />
          <RingCardSkeleton />
          <RingCardSkeleton />
          <CardSkeleton height={SKELETON_HEIGHT.recent} />
        </div>
      </div>

      <div className={styles.column}>
        <CardSkeleton />
        <CardSkeleton height={SKELETON_HEIGHT.topSpendings} />
      </div>

      <div className={styles.column}>
        <CardSkeleton height={SKELETON_HEIGHT.trend} />
        <CardSkeleton />
      </div>
    </div>
  </div>
);

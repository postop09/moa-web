'use client';

import { Calendar, Home, List, Settings, type LucideIcon } from 'lucide-react';
import dynamic from 'next/dynamic';

import { MoaLogo } from '@/shared/ui';

import styles from './welcome.module.css';

// echarts는 랜딩 첫 화면의 장식용 목업에만 쓰이므로 초기 번들에서 분리한다.
const ProductChart = dynamic(
  () => import('./ProductChart').then((mod) => mod.ProductChart),
  {
    ssr: false,
    loading: () => <div className={styles.desktopChart} />,
  },
);

const NAV_ITEMS: Array<{
  id: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}> = [
  { id: 'home', label: '홈', icon: Home, active: true },
  { id: 'history', label: '내역', icon: List, active: false },
  { id: 'calendar', label: '달력', icon: Calendar, active: false },
  { id: 'settings', label: '설정', icon: Settings, active: false },
];

type Props = {
  className?: string;
  clipped?: boolean;
};

export const ProductFrame = ({ className, clipped = false }: Props) => {
  return (
    <div
      className={`${styles.desktopFrame} ${clipped ? styles.desktopFrameClipped : ''} ${className ?? ''}`}
      aria-hidden
    >
      <div className={styles.desktopChrome}>
        <span />
        <span />
        <span />
      </div>
      <div className={styles.desktopBody}>
        <aside className={styles.desktopSidebar}>
          <span className={styles.desktopBrand}>
            <MoaLogo variant="black" size={20} />
            모아
          </span>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <span
                key={item.id}
                className={`${styles.desktopNavItem} ${
                  item.active ? styles.desktopNavActive : ''
                }`}
              >
                <Icon size={14} strokeWidth={1.75} />
                {item.label}
              </span>
            );
          })}
        </aside>
        <div className={styles.desktopMain}>
          <p className={styles.desktopKicker}>내 자산</p>
          <p className={styles.desktopBalance}>2,400,000원</p>
          <ProductChart />
          <div className={styles.desktopMiniCards}>
            <span className={styles.desktopMiniCard}>수입 300만</span>
            <span className={styles.desktopMiniCard}>지출 60만</span>
            <span className={styles.desktopMiniCard}>저축 100만</span>
          </div>
        </div>
      </div>
    </div>
  );
};

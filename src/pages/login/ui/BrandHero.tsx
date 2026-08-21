'use client';

import { MoaLogo } from '@/shared/ui';

import styles from './login.module.css';
import EChartsReact from 'echarts-for-react';

const option = {
  graphic: {
    elements: [
      {
        type: 'text',
        left: 'center',
        top: 'center',
        style: {
          text: '모아',
          fontSize: 70,
          fontWeight: 'bold',
          lineDash: [0, 200],
          lineDashOffset: 0,
          fill: 'transparent',
          stroke: '#000',
          lineWidth: 1,
        },
        keyframeAnimation: {
          duration: 2000,
          keyframes: [
            {
              percent: 0.7,
              style: {
                fill: 'transparent',
                lineDashOffset: 200,
                lineDash: [200, 0],
              },
            },
            {
              percent: 0.8,
              style: {
                fill: 'transparent',
              },
            },
            {
              percent: 1,
              style: {
                fill: '#2a2a2a',
              },
            },
          ],
        },
      },
    ],
  },
};

export const BrandHero = () => {
  return (
    <header className={styles.hero}>
      <EChartsReact option={option} style={{ height: '90px' }} />
      <MoaLogo variant="black" size={88} className={styles.brand} priority />
      <h1 className={styles.headline}>통계로 보는 자산</h1>
      <p className={styles.support}>그래프 중심 가계부로 흐름을 한눈에.</p>
    </header>
  );
};

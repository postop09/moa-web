'use client';

import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

import styles from './home.module.css';

type Props = {
  label: string;
  valueLabel: string;
  ratio: number | null;
  negative?: boolean;
};

export const MetricRingCard = ({
  label,
  valueLabel,
  ratio,
  negative = false,
}: Props) => {
  const clamped = ratio === null ? 0 : Math.max(0, Math.min(100, ratio));

  const option = useMemo<EChartsOption>(() => {
    return {
      series: [
        {
          type: 'pie',
          radius: ['68%', '88%'],
          center: ['50%', '50%'],
          silent: true,
          label: { show: false },
          labelLine: { show: false },
          data: [
            {
              value: clamped,
              itemStyle: {
                color: negative ? '#b91c1c' : '#0d9488',
              },
            },
            {
              value: Math.max(0.0001, 100 - clamped),
              itemStyle: {
                color: '#e2e8f0',
              },
              tooltip: { show: false },
            },
          ],
        },
      ],
    };
  }, [clamped, negative]);

  return (
    <div className={styles.ringCard}>
      <div className={styles.ringChart}>
        <ReactECharts
          option={option}
          opts={{ renderer: 'canvas' }}
          style={{ height: '100%', width: '100%' }}
          notMerge
          lazyUpdate
        />
      </div>
      <div className={styles.ringBody}>
        <p className={styles.ringLabel}>{label}</p>
        <p className={`${styles.ringValue} ${negative ? styles.ringNegative : ''}`}>
          {valueLabel}
        </p>
      </div>
    </div>
  );
};

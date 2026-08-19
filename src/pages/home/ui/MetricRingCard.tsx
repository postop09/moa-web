'use client';

import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

import { TRANSACTION_TYPE_COLOR } from '@/shared/model';

import styles from './home.module.css';

type Props = {
  label: string;
  valueLabel: string;
  ratio: number | null;
  negative?: boolean;
  color?: string;
};

export const MetricRingCard = ({
  label,
  valueLabel,
  ratio,
  negative = false,
  color = '#0d9488',
}: Props) => {
  const clamped = ratio === null ? 0 : Math.max(0, Math.min(100, ratio));

  const option = useMemo<EChartsOption>(() => {
    return {
      series: [
        {
          type: 'pie',
          radius: ['60%', '88%'],
          center: ['50%', '50%'],
          silent: true,
          label: { show: false },
          labelLine: { show: false },
          data: [
            {
              value: clamped,
              itemStyle: {
                color: negative ? TRANSACTION_TYPE_COLOR.expense : color,
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
  }, [clamped, color, negative]);

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
        <p
          className={`${styles.ringValue} ${negative ? styles.ringNegative : ''}`}
        >
          {valueLabel}
        </p>
      </div>
    </div>
  );
};

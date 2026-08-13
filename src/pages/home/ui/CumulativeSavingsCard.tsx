'use client';

import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

import type { CumulativeSavingPoint } from '@/features/transaction';

import styles from './home.module.css';

type Props = {
  items: CumulativeSavingPoint[];
};

const formatAmount = (amount: number) => {
  return `${amount.toLocaleString('ko-KR')}원`;
};

export const CumulativeSavingsCard = ({ items }: Props) => {
  const latest = items.length > 0 ? items[items.length - 1].amount : 0;
  const hasData = items.length > 0;

  const option = useMemo<EChartsOption>(() => {
    return {
      grid: {
        left: 8,
        right: 12,
        top: 16,
        bottom: 24,
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const item = Array.isArray(params) ? params[0] : params;
          if (!item || typeof item !== 'object') {
            return '';
          }
          const name = 'name' in item ? String(item.name) : '';
          const value = 'value' in item ? Number(item.value) : 0;
          return `${name}: ${value.toLocaleString('ko-KR')}원`;
        },
      },
      xAxis: {
        type: 'category',
        data: items.map((item) => item.label),
        boundaryGap: false,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          hideOverlap: true,
        },
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          formatter: (value: number) => {
            if (value >= 10000) {
              return `${Math.round(value / 10000)}만`;
            }
            return String(value);
          },
        },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
      },
      series: [
        {
          type: 'line',
          data: items.map((item) => item.amount),
          smooth: true,
          showSymbol: false,
          lineStyle: {
            color: '#2563eb',
            width: 2,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(37, 99, 235, 0.28)' },
                { offset: 1, color: 'rgba(37, 99, 235, 0.02)' },
              ],
            },
          },
          itemStyle: {
            color: '#2563eb',
          },
        },
      ],
    };
  }, [items]);

  return (
    <section className={styles.card}>
      <div className={styles.cardTitleRow}>
        <h3 className={styles.cardTitle}>누적 저축</h3>
        <p className={styles.cardMeta}>{formatAmount(latest)}</p>
      </div>
      {hasData ? (
        <div className={styles.chart}>
          <ReactECharts
            option={option}
            opts={{ renderer: 'canvas' }}
            style={{ height: 240, width: '100%' }}
            notMerge
            lazyUpdate
          />
        </div>
      ) : (
        <p className={styles.empty}>저축 내역이 없습니다.</p>
      )}
    </section>
  );
};

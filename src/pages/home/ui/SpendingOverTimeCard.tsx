'use client';

import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

import type { MonthlyExpense } from '@/features/transaction';
import { formatAmount } from '@/shared/lib';

import styles from './home.module.css';

type Props = {
  items: MonthlyExpense[];
};

export const SpendingOverTimeCard = ({ items }: Props) => {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const hasData = total > 0;

  const option = useMemo<EChartsOption>(() => {
    return {
      grid: {
        left: 8,
        right: 8,
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
          return `${name}: ${formatAmount(value)}`;
        },
      },
      xAxis: {
        type: 'category',
        data: items.map((item) => item.label),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
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
          type: 'bar',
          data: items.map((item) => item.amount),
          barWidth: 18,
          itemStyle: {
            color: '#92003A',
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }, [items]);

  return (
    <section className={styles.card}>
      <div className={styles.cardTitleRow}>
        <h3 className={styles.cardTitle}>월별 지출</h3>
      </div>
      {hasData ? (
        <div className={styles.chart}>
          <ReactECharts
            option={option}
            opts={{ renderer: 'canvas' }}
            style={{ height: 220, width: '100%' }}
            notMerge
            lazyUpdate
          />
        </div>
      ) : (
        <p className={styles.empty}>최근 6개월 지출이 없습니다.</p>
      )}
    </section>
  );
};

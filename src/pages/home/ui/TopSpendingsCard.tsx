'use client';

import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

import type { ExpenseByCategory } from '@/features/transaction';

import styles from './home.module.css';

type Props = {
  items: ExpenseByCategory[];
};

export const TopSpendingsCard = ({ items }: Props) => {
  const hasData = items.length > 0;

  const option = useMemo<EChartsOption>(() => {
    const maxAmount = Math.max(...items.map((item) => item.amount), 1);
    const data = items.map((item, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      return {
        value: [col, row, item.amount],
        name: item.name,
        symbolSize: 28 + (item.amount / maxAmount) * 52,
        itemStyle: {
          color:
            index % 3 === 0
              ? '#0d9488'
              : index % 3 === 1
                ? '#14b8a6'
                : '#64748b',
        },
      };
    });

    return {
      grid: {
        left: 24,
        right: 24,
        top: 24,
        bottom: 24,
      },
      tooltip: {
        formatter: (params) => {
          if (!params || typeof params !== 'object' || Array.isArray(params)) {
            return '';
          }
          const name = 'name' in params ? String(params.name) : '';
          const value = 'value' in params ? params.value : null;
          const amount = Array.isArray(value) ? Number(value[2]) : 0;
          return `${name}: ${amount.toLocaleString('ko-KR')}원`;
        },
      },
      xAxis: {
        type: 'value',
        min: -0.5,
        max: 2.5,
        show: false,
      },
      yAxis: {
        type: 'value',
        min: -0.5,
        max: Math.max(1.5, Math.ceil(items.length / 3) - 0.5),
        inverse: true,
        show: false,
      },
      series: [
        {
          type: 'scatter',
          data,
          label: {
            show: true,
            formatter: (params) => {
              const name =
                params && typeof params === 'object' && 'name' in params
                  ? String(params.name)
                  : '';
              const value =
                params && typeof params === 'object' && 'value' in params
                  ? params.value
                  : null;
              const amount = Array.isArray(value) ? Number(value[2]) : 0;
              return `${amount.toLocaleString('ko-KR')}\n${name}`;
            },
            color: '#fff',
            fontSize: 10,
            fontWeight: 600,
            lineHeight: 14,
          },
        },
      ],
    };
  }, [items]);

  const chartHeight = Math.max(200, Math.ceil(items.length / 3) * 100);

  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitle}>상위 지출</h3>
      {hasData ? (
        <div className={styles.chart}>
          <ReactECharts
            option={option}
            opts={{ renderer: 'canvas' }}
            style={{ height: chartHeight, width: '100%' }}
            notMerge
            lazyUpdate
          />
        </div>
      ) : (
        <p className={styles.empty}>이번 달 지출이 없습니다.</p>
      )}
    </section>
  );
};

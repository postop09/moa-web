'use client';

import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

import type { ExpenseByCategory } from '@/features/transaction';
import { formatAmount } from '@/shared/lib';

import styles from './home.module.css';
import { EXPENSE_COLORS } from '../config/expenseColors';

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
        symbolSize: 30 + (item.amount / maxAmount) * 52,
        itemStyle: {
          color: EXPENSE_COLORS[index],
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
          return `${name}: ${formatAmount(amount)}`;
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
            fontSize: 8,
            fontWeight: 600,
          },
        },
      ],
    };
  }, [items]);

  const chartHeight = Math.max(150, Math.ceil(items.length / 3) * 100);

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

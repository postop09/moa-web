'use client';

import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

import type { ExpenseByCategory } from '@/features/transaction';

import styles from './home.module.css';
import { EXPENSE_COLORS } from '../config/expenseColors';

type Props = {
  items: ExpenseByCategory[];
};

export const CategoryPieCard = ({ items }: Props) => {
  const hasData = items.length > 0;
  console.log(items);

  const option = useMemo<EChartsOption>(() => {
    return {
      color: EXPENSE_COLORS,
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}원 ({d}%)',
      },
      legend: {
        bottom: 0,
        type: 'scroll',
        textStyle: {
          color: '#64748b',
          fontSize: 12,
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['50%', '44%'],
          label: { show: false },
          labelLine: { show: false },
          data: items.map((item) => ({
            name: item.name,
            value: item.amount,
          })),
        },
      ],
    };
  }, [items]);

  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitle}>지출 구성</h3>
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
        <p className={styles.empty}>이번 달 지출이 없습니다.</p>
      )}
    </section>
  );
};

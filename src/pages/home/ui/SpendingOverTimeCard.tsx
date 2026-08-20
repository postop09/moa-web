'use client';

import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

import type { MonthlyExpense } from '@/features/transaction';
import { formatAmount } from '@/shared/lib';

import { EXPENSE_COLORS } from '../config/expenseColors';
import styles from './home.module.css';

type Props = {
  items: MonthlyExpense[];
};

type CategorySeries = {
  name: string;
  data: number[];
};

const buildCategorySeries = (items: MonthlyExpense[]): CategorySeries[] => {
  const totals = new Map<string, number>();

  for (const item of items) {
    for (const category of item.byCategory) {
      totals.set(
        category.name,
        (totals.get(category.name) ?? 0) + category.amount,
      );
    }
  }

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => ({
      name,
      data: items.map((item) => {
        const matched = item.byCategory.find(
          (category) => category.name === name,
        );
        return matched?.amount ?? 0;
      }),
    }));
};

export const SpendingOverTimeCard = ({ items }: Props) => {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const hasData = total > 0;
  const categorySeries = useMemo(() => buildCategorySeries(items), [items]);

  const option = useMemo<EChartsOption>(() => {
    return {
      color: EXPENSE_COLORS,
      grid: {
        left: 8,
        right: 8,
        top: 16,
        bottom: 40,
        containLabel: true,
      },
      legend: {
        bottom: 0,
        type: 'scroll',
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: {
          color: '#64748b',
          fontSize: 11,
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const seriesItems = Array.isArray(params) ? params : [params];
          if (seriesItems.length === 0) {
            return '';
          }

          const title =
            'name' in seriesItems[0] ? String(seriesItems[0].name) : '';
          const lines = seriesItems
            .filter((item) => 'value' in item && Number(item.value) > 0)
            .map((item) => {
              const marker = 'marker' in item ? String(item.marker) : '';
              const seriesName =
                'seriesName' in item ? String(item.seriesName) : '';
              const value = 'value' in item ? Number(item.value) : 0;
              return `${marker}${seriesName}: ${formatAmount(value)}`;
            });
          const monthTotal = seriesItems.reduce((sum, item) => {
            return sum + ('value' in item ? Number(item.value) : 0);
          }, 0);

          return `${title}<br/>${lines.join('<br/>')}<br/>합계: ${formatAmount(monthTotal)}`;
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
      series: categorySeries.map((category, index, list) => ({
        name: category.name,
        type: 'bar' as const,
        stack: 'expense',
        data: category.data,
        barWidth: 18,
        emphasis: { focus: 'series' as const },
        itemStyle: {
          borderColor: '#fff',
          borderRadius: index === list.length - 1 ? [4, 4, 0, 0] : 0,
        },
      })),
    };
  }, [categorySeries, items]);

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
            style={{ height: 260, width: '100%' }}
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

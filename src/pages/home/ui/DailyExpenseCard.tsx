'use client';

import type { EChartsOption } from 'echarts';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { useMemo } from 'react';

import type { DailyExpense } from '@/features/transaction';
import { formatAmount } from '@/shared/lib';
import { echarts } from '@/shared/lib/echarts';

import { EXPENSE_COLORS } from '../config/expenseColors';
import { buildCategorySeries } from '../lib/buildCategorySeries';
import styles from './home.module.css';

type Props = {
  items: DailyExpense[];
  selectedMonth: Date;
};

const WEEKDAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'];

export const DailyExpenseCard = ({ items, selectedMonth }: Props) => {
  const month = selectedMonth.getMonth() + 1;
  const daysInMonth = items.length;
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === selectedMonth.getFullYear() &&
    today.getMonth() === selectedMonth.getMonth();
  const elapsedDays = isCurrentMonth
    ? Math.min(today.getDate(), daysInMonth)
    : daysInMonth;

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const hasData = total > 0;
  const average = elapsedDays > 0 ? Math.round(total / elapsedDays) : 0;
  const categorySeries = useMemo(() => buildCategorySeries(items), [items]);

  const option = useMemo<EChartsOption>(() => {
    return {
      color: EXPENSE_COLORS,
      grid: {
        left: 8,
        right: 12,
        top: 12,
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
          const tooltipItems = Array.isArray(params) ? params : [params];
          const first = tooltipItems[0];
          if (!first || typeof first !== 'object' || !('dataIndex' in first)) {
            return '';
          }

          const item = items[Number(first.dataIndex)];
          if (!item) {
            return '';
          }

          const date = new Date(
            selectedMonth.getFullYear(),
            selectedMonth.getMonth(),
            item.day,
          );
          const title = `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAY_LABEL[date.getDay()]})`;

          const lines = tooltipItems
            .filter((entry) => 'value' in entry && Number(entry.value) > 0)
            .map((entry) => {
              const marker = 'marker' in entry ? String(entry.marker) : '';
              const seriesName =
                'seriesName' in entry ? String(entry.seriesName) : '';
              const value = 'value' in entry ? Number(entry.value) : 0;
              return `${marker}${seriesName}: ${formatAmount(value)}`;
            });

          if (lines.length === 0) {
            return `${title}<br/>지출 없음`;
          }

          return `${title}<br/>${lines.join('<br/>')}<br/>합계: ${formatAmount(item.amount)}`;
        },
      },
      xAxis: {
        type: 'category',
        data: items.map((item) => item.label),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          hideOverlap: true,
          interval: (_index: number, value: string) =>
            [1, 5, 10, 15, 20, 25, daysInMonth].includes(Number(value)),
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          formatter: (value: number) => {
            if (Math.abs(value) >= 10000) {
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
        barMaxWidth: 12,
        emphasis: { focus: 'series' as const },
        itemStyle: {
          borderColor: '#fff',
          borderRadius: index === list.length - 1 ? [3, 3, 0, 0] : 0,
        },
        ...(index === list.length - 1
          ? {
              showBackground: true,
              backgroundStyle: { color: 'rgba(15, 23, 42, 0.04)' },
            }
          : {}),
      })),
    };
  }, [categorySeries, daysInMonth, items, selectedMonth]);

  const ariaLabel = `${month}월 일일 지출 막대 그래프. 일평균 ${formatAmount(average)}.`;

  return (
    <section className={styles.card}>
      <div className={styles.cardTitleRow}>
        <h3 className={styles.cardTitle}>일일 지출</h3>
        <p className={styles.cardMeta}>평균 {formatAmount(average)}</p>
      </div>
      {hasData ? (
        <>
          <div className={styles.chart} role="img" aria-label={ariaLabel}>
            <ReactEChartsCore
              echarts={echarts}
              option={option}
              opts={{ renderer: 'canvas' }}
              style={{ height: 240, width: '100%' }}
              notMerge
              lazyUpdate
            />
          </div>
        </>
      ) : (
        <div className={styles.chartEmpty}>
          <p className={styles.empty}>이 달의 지출 기록이 없습니다.</p>
        </div>
      )}
    </section>
  );
};

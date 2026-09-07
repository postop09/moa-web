'use client';

import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

import type { DailyExpense } from '@/features/transaction';
import { TRANSACTION_TYPE_COLOR } from '@/shared/model';
import { formatAmount } from '@/shared/lib';

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

  const maxItem = useMemo(() => {
    return items.reduce<DailyExpense | null>((max, item) => {
      if (!max || item.amount > max.amount) {
        return item;
      }
      return max;
    }, null);
  }, [items]);

  const zeroDaysCount = items.filter((item) => item.amount === 0).length;

  const option = useMemo<EChartsOption>(() => {
    return {
      grid: {
        left: 8,
        right: 12,
        top: 12,
        bottom: 24,
        containLabel: true,
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
          const body =
            item.amount === 0
              ? '지출 없음'
              : `지출: ${formatAmount(item.amount)}`;

          return `${title}<br/>${body}`;
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
      series: [
        {
          type: 'bar' as const,
          data: items.map((item) => item.amount),
          barMaxWidth: 12,
          itemStyle: {
            color: TRANSACTION_TYPE_COLOR.expense,
            borderRadius: [3, 3, 0, 0],
          },
          showBackground: true,
          backgroundStyle: {
            color: 'rgba(15, 23, 42, 0.04)',
          },
        },
      ],
    };
  }, [daysInMonth, items, selectedMonth]);

  const maxCaptionText =
    maxItem && maxItem.amount > 0
      ? `최대 지출일 ${month}월 ${maxItem.day}일 ${formatAmount(maxItem.amount)}.`
      : '';

  const ariaLabel = `${month}월 일일 지출 막대 그래프. 일평균 ${formatAmount(average)}. ${maxCaptionText} 지출이 없는 날 ${zeroDaysCount}일.`;

  return (
    <section className={styles.card}>
      <div className={styles.cardTitleRow}>
        <h3 className={styles.cardTitle}>일일 지출</h3>
        <p className={styles.cardMeta}>일평균 {formatAmount(average)}</p>
      </div>
      {hasData ? (
        <>
          <div className={styles.chart} role="img" aria-label={ariaLabel}>
            <ReactECharts
              option={option}
              opts={{ renderer: 'canvas' }}
              style={{ height: 240, width: '100%' }}
              notMerge
              lazyUpdate
            />
          </div>
          {maxItem && maxItem.amount > 0 ? (
            <p className={styles.cardCaption}>
              최대 지출 {month}월 {maxItem.day}일 ·{' '}
              {formatAmount(maxItem.amount)}
            </p>
          ) : null}
        </>
      ) : (
        <div className={styles.chartEmpty}>
          <p className={styles.empty}>이 달의 지출 기록이 없습니다.</p>
        </div>
      )}
    </section>
  );
};

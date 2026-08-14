'use client';

import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

import type { AssetTrendPoint } from '@/features/transaction';

import styles from './home.module.css';

type Props = {
  items: AssetTrendPoint[];
};

const formatAmount = (amount: number) => {
  return `${amount.toLocaleString('ko-KR')}원`;
};

const SERIES = [
  { key: 'income', label: '수입', color: '#0d9488' },
  { key: 'expense', label: '지출', color: '#b91c1c' },
  { key: 'saving', label: '저축', color: '#2563eb' },
  { key: 'asset', label: '자산', color: '#7c3aed' },
] as const;

export const AssetTrendCard = ({ items }: Props) => {
  const latest = items.length > 0 ? items[items.length - 1] : null;
  const hasData =
    latest !== null &&
    (latest.income !== 0 || latest.expense !== 0 || latest.saving !== 0);

  const option = useMemo<EChartsOption>(() => {
    return {
      legend: {
        top: 0,
        right: 0,
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 16,
        textStyle: {
          color: '#64748b',
          fontSize: 12,
        },
        data: SERIES.map((series) => series.label),
      },
      grid: {
        left: 8,
        right: 12,
        top: 36,
        bottom: 24,
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const items = Array.isArray(params) ? params : [params];
          if (items.length === 0) {
            return '';
          }

          const first = items[0];
          const name =
            first && typeof first === 'object' && 'name' in first
              ? String(first.name)
              : '';
          const lines = items.map((item) => {
            if (!item || typeof item !== 'object') {
              return '';
            }
            const seriesName = 'seriesName' in item ? String(item.seriesName) : '';
            const value = 'value' in item ? Number(item.value) : 0;
            const marker = 'marker' in item ? String(item.marker) : '';
            return `${marker}${seriesName}: ${value.toLocaleString('ko-KR')}원`;
          });

          return [name, ...lines].filter(Boolean).join('<br/>');
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
            if (Math.abs(value) >= 10000) {
              return `${Math.round(value / 10000)}만`;
            }
            return String(value);
          },
        },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
      },
      series: SERIES.map((series) => ({
        name: series.label,
        type: 'line' as const,
        data: items.map((item) => item[series.key]),
        smooth: true,
        showSymbol: false,
        lineStyle: {
          color: series.color,
          width: 2,
        },
        itemStyle: {
          color: series.color,
        },
      })),
    };
  }, [items]);

  return (
    <section className={styles.card}>
      <div className={styles.cardTitleRow}>
        <h3 className={styles.cardTitle}>내 자산 동향</h3>
        <p className={styles.cardMeta}>{formatAmount(latest?.asset ?? 0)}</p>
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
        <p className={styles.empty}>최근 1년 기록이 없습니다.</p>
      )}
    </section>
  );
};

'use client';

import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useMemo, useState } from 'react';

import type { ExpenseByCategory } from '@/features/transaction';

import styles from './home.module.css';
import { EXPENSE_COLORS } from '../config/expenseColors';

type LegendselectedParams = {
  name: string;
  selected: Record<string, boolean>;
  type: 'legendselectchanged';
};

type Props = {
  items: ExpenseByCategory[];
};

export const CategoryPieCard = ({ items }: Props) => {
  const hasData = items.length > 0;
  const itemNames = useMemo(() => items.map((item) => item.name), [items]);
  const [selectedItems, setSelectedItems] = useState<string[]>(itemNames);
  const selectedTotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const matchedItem = items.find((i) => i.name === item);
      return sum + (matchedItem?.amount || 0);
    }, 0);
  }, [items, selectedItems]);

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
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 1.5,
          },
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
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>지출 구성</h3>
        <p className={styles.cardMeta}>{selectedTotal.toLocaleString('ko-KR')}원</p>
      </div>
      {hasData ? (
        <div className={styles.chart}>
          <ReactECharts
            option={option}
            opts={{ renderer: 'canvas' }}
            style={{ height: 240, width: '100%' }}
            notMerge
            lazyUpdate
            onEvents={{
              legendselectchanged: (params: LegendselectedParams) => {
                console.log('legendselectchanged', params);
                const selected = params.selected;
                const selectedItems = Object.keys(selected).filter(key => selected[key]);
                setSelectedItems(selectedItems);
              },
            }}
          />
        </div>
      ) : (
        <p className={styles.empty}>이번 달 지출이 없습니다.</p>
      )}
    </section>
  );
};

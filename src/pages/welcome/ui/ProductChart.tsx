'use client';

import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useEffect, useMemo, useState } from 'react';

import {
  PREVIEW_ASSET_COLOR,
  PREVIEW_ASSET_TREND,
} from '../config/previewChart';
import styles from './welcome.module.css';

const hexToRgba = (hex: string, alpha: number) => {
  const value = hex.replace('#', '');
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const ProductChart = () => {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setReduceMotion(media.matches);
    };

    sync();
    media.addEventListener('change', sync);

    return () => {
      media.removeEventListener('change', sync);
    };
  }, []);

  const option = useMemo<EChartsOption>(() => {
    return {
      animation: !reduceMotion,
      grid: {
        left: 4,
        right: 8,
        top: 8,
        bottom: 4,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: PREVIEW_ASSET_TREND.map((item) => item.label),
        boundaryGap: false,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: {
          color: '#64748b',
          fontSize: 10,
        },
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLabel: {
          color: '#64748b',
          fontSize: 10,
          formatter: (value: number) => {
            if (Math.abs(value) >= 10_000) {
              return `${Math.round(value / 10_000)}만`;
            }
            return String(value);
          },
        },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
      },
      series: [
        {
          name: '자산',
          type: 'line',
          data: PREVIEW_ASSET_TREND.map((item) => item.asset),
          smooth: true,
          showSymbol: false,
          silent: true,
          lineStyle: {
            color: PREVIEW_ASSET_COLOR,
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
                { offset: 0, color: hexToRgba(PREVIEW_ASSET_COLOR, 0.5) },
                { offset: 1, color: hexToRgba(PREVIEW_ASSET_COLOR, 0.1) },
              ],
            },
          },
          itemStyle: {
            color: PREVIEW_ASSET_COLOR,
          },
        },
      ],
    };
  }, [reduceMotion]);

  return (
    <div className={styles.desktopChart}>
      <ReactECharts
        option={option}
        opts={{ renderer: 'canvas' }}
        style={{ height: 140, width: '100%' }}
        notMerge
        lazyUpdate
      />
    </div>
  );
};

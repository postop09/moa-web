import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// ProductChart(랜딩 미리보기)만 쓰는 등록. 홈 대시보드의 echarts 등록(src/shared/lib/echarts.ts)과
// 일부러 분리했다 — 공유하면 webpack이 두 청크를 합쳐 서로 안 쓰는 차트 타입까지 함께 받아간다.
echarts.use([LineChart, GridComponent, CanvasRenderer]);

export { echarts };

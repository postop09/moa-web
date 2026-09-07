import * as echarts from 'echarts/core';
import { BarChart, PieChart, ScatterChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// 홈 대시보드 차트(막대/파이/스캐터)가 실제로 쓰는 모듈만 등록해 echarts 풀 번들을 피한다.
// 다른 화면에 echarts가 더 필요하면(예: 랜딩의 line 차트는 src/pages/welcome/lib/echarts.ts 참고)
// 이 모듈을 공유하지 말고 그 화면 전용 등록 모듈을 새로 만들 것 — 한 모듈에 전부 등록하면
// webpack이 두 화면의 청크를 합쳐서 서로 안 쓰는 차트 타입까지 함께 받아가게 된다.
echarts.use([
  BarChart,
  PieChart,
  ScatterChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
]);

export { echarts };

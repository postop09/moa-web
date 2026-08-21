export type PreviewChartPoint = {
  label: string;
  asset: number;
};

export const PREVIEW_ASSET_TREND: PreviewChartPoint[] = [
  { label: '3월', asset: 820_000 },
  { label: '4월', asset: 980_000 },
  { label: '5월', asset: 1_050_000 },
  { label: '6월', asset: 1_180_000 },
  { label: '7월', asset: 1_260_000 },
  { label: '8월', asset: 1_400_000 },
];

export const PREVIEW_ASSET_COLOR = '#7c3aed';

export const PREVIEW_LATEST_ASSET =
  PREVIEW_ASSET_TREND[PREVIEW_ASSET_TREND.length - 1]?.asset ?? 0;

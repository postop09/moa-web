// 데이터 도착 후에야 카드 청크 로드가 시작되던 직렬 hop을 없앤다 — webpack은 같은 specifier를 같은 청크로 묶으므로
// 여기서 미리 받으면 DashboardSection의 dynamic()이 그 청크를 재사용하고, allSettled라 실패해도 unhandled rejection이 없다.
export const warmDashboardChunks = () =>
  Promise.allSettled([
    import('./CategoryPieCard'),
    import('./DailyExpenseCard'),
    import('./MetricRingCard'),
    import('./SpendingOverTimeCard'),
    import('./TopSpendingsCard'),
  ]);

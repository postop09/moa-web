import * as allYearHolidays from '@hyunbinseo/holidays-kr/all';

// 이 패키지는 매년 새 연도(y2018, y2019, ...)를 export에 추가한다.
// 연도를 이 파일에 수동으로 나열하지 않도록 네임스페이스 전체를 병합한다 —
// pnpm update로 패키지를 최신화하기만 하면 새 연도가 자동으로 반영된다.
const HOLIDAYS: Record<string, readonly string[]> = Object.assign(
  {},
  ...Object.values(allYearHolidays),
);

export const getHolidayNames = (
  dayKey: string,
): readonly string[] | undefined => HOLIDAYS[dayKey];

export const formatHolidayNames = (names: readonly string[]): string =>
  names.join(', ');

import { startOfMonth } from '@/shared/lib';

export const VISIBLE_DAY_COUNT = 42;

export const WEEKDAY_LABELS = [
  '일',
  '월',
  '화',
  '수',
  '목',
  '금',
  '토',
] as const;

export const getVisibleCalendarDays = (month: Date) => {
  const first = startOfMonth(month);
  const gridStart = new Date(
    first.getFullYear(),
    first.getMonth(),
    first.getDate() - first.getDay(),
  );

  return Array.from({ length: VISIBLE_DAY_COUNT }, (_, index) => {
    return new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index,
    );
  });
};

export const getVisibleCalendarRange = (month: Date) => {
  const days = getVisibleCalendarDays(month);
  const first = days[0] ?? startOfMonth(month);
  const last = days[days.length - 1] ?? first;

  const from = new Date(
    first.getFullYear(),
    first.getMonth(),
    first.getDate(),
    0,
    0,
    0,
    0,
  );
  const to = new Date(
    last.getFullYear(),
    last.getMonth(),
    last.getDate(),
    23,
    59,
    59,
    999,
  );

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
};

export const toDayKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDayKey = (key: string) => {
  const [yearText, monthText, dayText] = key.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null;
  }

  return new Date(year, month - 1, day);
};

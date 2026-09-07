// 월 경계는 접속 기기의 로컬 타임존이 아니라 가계부의 기준 타임존(KST, DST 없음)으로 고정한다.
// 그렇지 않으면 해외에 있거나 기기 TZ가 다른 사용자는 월초/월말 거래가 옆 달로 새거나 빠진다.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const getKstDateParts = (date: Date) => {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return {
    year: kst.getUTCFullYear(),
    month: kst.getUTCMonth(),
  };
};

const kstInstant = (
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  seconds: number,
  ms: number,
) =>
  new Date(
    Date.UTC(year, month, day, hours, minutes, seconds, ms) - KST_OFFSET_MS,
  );

export const getMonthRange = (referenceDate = new Date()) => {
  const { year, month } = getKstDateParts(referenceDate);

  const from = kstInstant(year, month, 1, 0, 0, 0, 0);
  const to = kstInstant(year, month + 1, 0, 23, 59, 59, 999);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
};

export const getTrailingMonthsRange = (
  monthCount: number,
  referenceDate = new Date(),
) => {
  const { year, month } = getKstDateParts(referenceDate);

  const from = kstInstant(year, month - (monthCount - 1), 1, 0, 0, 0, 0);
  const to = kstInstant(year, month + 1, 0, 23, 59, 59, 999);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
};

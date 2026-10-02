const HOURS_PER_DAY = 24;

/** 경과 시간(정수 시간)을 "1시간 미만 / N시간 / N일 / N일 M시간" 으로 표기한다. */
export const formatWaitingTime = (hours: number): string => {
  if (hours < 1) return '1시간 미만';

  const days = Math.floor(hours / HOURS_PER_DAY);
  const rest = hours % HOURS_PER_DAY;

  if (days === 0) return `${rest}시간`;

  return rest === 0 ? `${days}일` : `${days}일 ${rest}시간`;
};

import { INQUIRY_OVERDUE_HOURS } from '../config/limits';

const HOUR_MS = 60 * 60 * 1000;

export const getWaitingHours = (
  since: string,
  now: number = Date.now(),
): number => Math.max(0, Math.floor((now - Date.parse(since)) / HOUR_MS));

export const isOverdue = (hours: number): boolean =>
  hours > INQUIRY_OVERDUE_HOURS;

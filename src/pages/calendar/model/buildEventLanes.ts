import type { Schedule } from '@/entities/schedule';
import { startOfDay } from '@/shared/lib';

const DAYS_PER_WEEK = 7;
const WEEK_COUNT = 6;
export const MAX_EVENT_LANES = 2;

export type EventSegment = {
  schedule: Schedule;
  weekIndex: number;
  startCol: number;
  endCol: number;
  lane: number;
  isStart: boolean;
  isEnd: boolean;
};

export type WeekLanes = {
  segments: EventSegment[];
  overflowByCol: number[];
};

export const scheduleOverlapsDay = (schedule: Schedule, day: Date) => {
  const dayStart = startOfDay(day).getTime();
  const nextDay = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate() + 1,
  ).getTime();
  const start = new Date(schedule.startAt).getTime();
  const end = new Date(schedule.endAt).getTime();
  return start < nextDay && end > dayStart;
};

const isFirstOccupiedDay = (schedule: Schedule, day: Date) => {
  const previous = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate() - 1,
  );
  return (
    scheduleOverlapsDay(schedule, day) &&
    !scheduleOverlapsDay(schedule, previous)
  );
};

const isLastOccupiedDay = (schedule: Schedule, day: Date) => {
  const next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
  return (
    scheduleOverlapsDay(schedule, day) && !scheduleOverlapsDay(schedule, next)
  );
};

const compareSchedules = (a: Schedule, b: Schedule) => {
  const startDiff =
    new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
  if (startDiff !== 0) {
    return startDiff;
  }

  return new Date(b.endAt).getTime() - new Date(a.endAt).getTime();
};

export const buildEventLanes = (
  days: Date[],
  schedules: Schedule[],
): WeekLanes[] => {
  const sorted = [...schedules].sort(compareSchedules);

  return Array.from({ length: WEEK_COUNT }, (_, weekIndex) => {
    const weekDays = days.slice(
      weekIndex * DAYS_PER_WEEK,
      weekIndex * DAYS_PER_WEEK + DAYS_PER_WEEK,
    );
    const occupancy: boolean[][] = [];
    const segments: EventSegment[] = [];
    const overflowByCol = Array.from({ length: DAYS_PER_WEEK }, () => 0);

    for (const schedule of sorted) {
      let startCol = -1;
      let endCol = -1;

      for (let col = 0; col < DAYS_PER_WEEK; col += 1) {
        const day = weekDays[col];
        if (!day || !scheduleOverlapsDay(schedule, day)) {
          continue;
        }

        if (startCol === -1) {
          startCol = col;
        }
        endCol = col;
      }

      if (startCol === -1 || endCol === -1) {
        continue;
      }

      let lane = 0;
      while (lane < MAX_EVENT_LANES) {
        const row =
          occupancy[lane] ?? Array.from({ length: DAYS_PER_WEEK }, () => false);
        occupancy[lane] = row;
        const taken = row.slice(startCol, endCol + 1).some(Boolean);
        if (!taken) {
          break;
        }
        lane += 1;
      }

      if (lane >= MAX_EVENT_LANES) {
        for (let col = startCol; col <= endCol; col += 1) {
          overflowByCol[col] = (overflowByCol[col] ?? 0) + 1;
        }
        continue;
      }

      const row =
        occupancy[lane] ?? Array.from({ length: DAYS_PER_WEEK }, () => false);
      for (let col = startCol; col <= endCol; col += 1) {
        row[col] = true;
      }
      occupancy[lane] = row;

      const startDay = weekDays[startCol];
      const endDay = weekDays[endCol];
      if (!startDay || !endDay) {
        continue;
      }

      segments.push({
        schedule,
        weekIndex,
        startCol,
        endCol,
        lane,
        isStart: isFirstOccupiedDay(schedule, startDay),
        isEnd: isLastOccupiedDay(schedule, endDay),
      });
    }

    return { segments, overflowByCol };
  });
};

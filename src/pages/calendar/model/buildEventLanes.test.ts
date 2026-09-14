import { describe, expect, it } from 'vitest';

import type { Schedule } from '@/entities/schedule';

import {
  MAX_EVENT_LANES,
  buildEventLanes,
  scheduleOverlapsDay,
} from './buildEventLanes';

let nextId = 1;

const makeSchedule = (overrides: Partial<Schedule>): Schedule => ({
  id: nextId++,
  householdId: 'household-1',
  title: '일정',
  memo: null,
  startAt: new Date(2025, 2, 4, 10, 0).toISOString(),
  endAt: new Date(2025, 2, 4, 11, 0).toISOString(),
  categoryId: null,
  createdBy: 'user-1',
  createdDt: '2025-01-01T00:00:00.000Z',
  updatedDt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

// 2025-03-02는 일요일이라 이 그리드의 0주차는 3/2(일)~3/8(토)로 정확히
// 캘린더 한 주와 일치한다. 1주차는 3/9(일)~3/15(토), 2주차는 3/16(일)~3/22(토).
const day = (offsetFromMar2: number) => new Date(2025, 2, 2 + offsetFromMar2);
const DAYS_42 = Array.from({ length: 42 }, (_, index) => day(index));

describe('scheduleOverlapsDay', () => {
  it('일정 기간과 겹치는 날은 true를 반환한다', () => {
    const schedule = makeSchedule({
      startAt: new Date(2025, 2, 4, 10, 0).toISOString(),
      endAt: new Date(2025, 2, 4, 12, 0).toISOString(),
    });

    expect(scheduleOverlapsDay(schedule, day(2))).toBe(true); // 3/4
  });

  it('일정 기간 전후의 날은 false를 반환한다', () => {
    const schedule = makeSchedule({
      startAt: new Date(2025, 2, 4, 10, 0).toISOString(),
      endAt: new Date(2025, 2, 4, 12, 0).toISOString(),
    });

    expect(scheduleOverlapsDay(schedule, day(1))).toBe(false); // 3/3
    expect(scheduleOverlapsDay(schedule, day(3))).toBe(false); // 3/5
  });
});

describe('buildEventLanes', () => {
  it('days나 schedules가 비어 있어도 항상 6주 배열을 반환한다', () => {
    const result = buildEventLanes([], []);

    expect(result).toHaveLength(6);
    result.forEach((week) => {
      expect(week.segments).toEqual([]);
      expect(week.overflowByCol).toEqual([0, 0, 0, 0, 0, 0, 0]);
    });
  });

  it('하루짜리 일정은 시작·끝이 모두 true인 세그먼트 하나를 만든다', () => {
    const schedule = makeSchedule({
      startAt: new Date(2025, 2, 4, 10, 0).toISOString(), // 화요일, col2
      endAt: new Date(2025, 2, 4, 11, 0).toISOString(),
    });

    const result = buildEventLanes(DAYS_42, [schedule]);

    expect(result[0]?.segments).toEqual([
      {
        schedule,
        weekIndex: 0,
        startCol: 2,
        endCol: 2,
        lane: 0,
        isStart: true,
        isEnd: true,
      },
    ]);
  });

  it('한 주 안에서 끝나는 여러 날짜 일정은 하나의 세그먼트로 표현된다', () => {
    const schedule = makeSchedule({
      startAt: new Date(2025, 2, 3, 9, 0).toISOString(), // 월(col1)
      endAt: new Date(2025, 2, 5, 18, 0).toISOString(), // 수(col3)
    });

    const result = buildEventLanes(DAYS_42, [schedule]);
    const segment = result[0]?.segments[0];

    expect(segment).toMatchObject({
      startCol: 1,
      endCol: 3,
      isStart: true,
      isEnd: true,
    });
  });

  it('여러 주에 걸친 일정은 주마다 세그먼트가 나뉘고 중간 주는 isStart·isEnd가 모두 false다', () => {
    const schedule = makeSchedule({
      startAt: new Date(2025, 2, 7, 9, 0).toISOString(), // 3/7(금, 0주차)
      endAt: new Date(2025, 2, 17, 18, 0).toISOString(), // 3/17(월, 2주차)
    });

    const result = buildEventLanes(DAYS_42, [schedule]);

    // 0주차: 3/7(금,col5)~3/8(토,col6) — 시작만 true
    expect(result[0]?.segments[0]).toMatchObject({
      startCol: 5,
      endCol: 6,
      isStart: true,
      isEnd: false,
    });

    // 1주차: 3/9~3/15 전체(col0~col6) — 계속 이어지므로 둘 다 false
    expect(result[1]?.segments[0]).toMatchObject({
      startCol: 0,
      endCol: 6,
      isStart: false,
      isEnd: false,
    });

    // 2주차: 3/16(일,col0)~3/17(월,col1) — 끝만 true
    expect(result[2]?.segments[0]).toMatchObject({
      startCol: 0,
      endCol: 1,
      isStart: false,
      isEnd: true,
    });
  });

  it(`같은 날 겹치는 일정이 MAX_EVENT_LANES(${MAX_EVENT_LANES})개를 넘으면 overflowByCol에 누적되고 세그먼트를 만들지 않는다`, () => {
    const schedules = [
      makeSchedule({
        startAt: new Date(2025, 2, 4, 9, 0).toISOString(),
        endAt: new Date(2025, 2, 4, 10, 0).toISOString(),
      }),
      makeSchedule({
        startAt: new Date(2025, 2, 4, 10, 0).toISOString(),
        endAt: new Date(2025, 2, 4, 11, 0).toISOString(),
      }),
      makeSchedule({
        startAt: new Date(2025, 2, 4, 11, 0).toISOString(),
        endAt: new Date(2025, 2, 4, 12, 0).toISOString(),
      }),
    ];

    const result = buildEventLanes(DAYS_42, schedules);

    expect(result[0]?.segments).toHaveLength(2);
    expect(result[0]?.segments.map((segment) => segment.lane)).toEqual([0, 1]);
    expect(result[0]?.overflowByCol[2]).toBe(1); // 화요일 col2
  });

  it('시작 시각이 같으면 더 긴 일정이 먼저 처리돼 lane 0을 차지한다', () => {
    const shorter = makeSchedule({
      title: '짧은 일정',
      startAt: new Date(2025, 2, 4, 9, 0).toISOString(),
      endAt: new Date(2025, 2, 4, 10, 0).toISOString(),
    });
    const longer = makeSchedule({
      title: '긴 일정',
      startAt: new Date(2025, 2, 4, 9, 0).toISOString(),
      endAt: new Date(2025, 2, 5, 10, 0).toISOString(),
    });

    // 입력 순서를 짧은 일정이 먼저 오도록 둬도 정렬 결과가 우선한다.
    const result = buildEventLanes(DAYS_42, [shorter, longer]);
    const segments = result[0]?.segments ?? [];

    expect(segments.find((s) => s.schedule === longer)?.lane).toBe(0);
    expect(segments.find((s) => s.schedule === shorter)?.lane).toBe(1);
  });
});

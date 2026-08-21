'use client';

import { useMemo, useState } from 'react';

import type { Schedule } from '@/entities/schedule';
import { useListHouseholdMembers } from '@/features/householdMember';
import { useGetProfile, useListProfilesByIds } from '@/features/profile';
import { useListSchedules } from '@/features/schedule';
import { useListScheduleCategories } from '@/features/scheduleCategory';
import { useListTransactions } from '@/features/transaction';
import {
  isSameDay,
  isSameMonth,
  shiftMonth,
  shiftYear,
  startOfDay,
  startOfMonth,
} from '@/shared/lib';

import { AUTHOR_COLORS } from '../config/authorColors';
import { scheduleOverlapsDay } from './buildEventLanes';
import {
  getVisibleCalendarDays,
  getVisibleCalendarRange,
  toDayKey,
} from './visibleRange';

export type AuthorFilter = 'all' | string;

export type AuthorOption = {
  id: string;
  label: string;
  color: string;
};

export type ScheduleFormMode =
  { type: 'create'; date: Date } | { type: 'edit'; schedule: Schedule };

export const useCalendarPage = (householdId: string | null) => {
  const [selectedMonth, setSelectedMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [showExpenses, setShowExpenses] = useState(true);
  const [authorFilter, setAuthorFilter] = useState<AuthorFilter>('all');
  const [scheduleFormMode, setScheduleFormMode] =
    useState<ScheduleFormMode | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(
    null,
  );

  const visibleRange = useMemo(
    () => getVisibleCalendarRange(selectedMonth),
    [selectedMonth],
  );
  const days = useMemo(
    () => getVisibleCalendarDays(selectedMonth),
    [selectedMonth],
  );

  const transactionsQuery = useListTransactions(
    householdId
      ? {
          householdId,
          from: visibleRange.from,
          to: visibleRange.to,
        }
      : null,
  );
  const schedulesQuery = useListSchedules(
    householdId
      ? {
          householdId,
          from: visibleRange.from,
          to: visibleRange.to,
        }
      : null,
  );
  const membersQuery = useListHouseholdMembers(householdId);
  const profileQuery = useGetProfile();
  const categoriesQuery = useListScheduleCategories(householdId);

  const memberIds = useMemo(
    () => (membersQuery.data ?? []).map((member) => member.userId),
    [membersQuery.data],
  );
  const profilesQuery = useListProfilesByIds(memberIds);

  const creatorNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const profile of profilesQuery.data ?? []) {
      map[profile.id] = profile.nickname;
    }
    return map;
  }, [profilesQuery.data]);

  const authorColorById = useMemo(() => {
    const map: Record<string, string> = {};
    (membersQuery.data ?? []).forEach((member, index) => {
      map[member.userId] = AUTHOR_COLORS[index % AUTHOR_COLORS.length];
    });
    return map;
  }, [membersQuery.data]);

  const scheduleCategories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );

  const categoryColorById = useMemo(() => {
    const map: Record<number, string> = {};
    for (const category of scheduleCategories) {
      map[category.id] = category.color;
    }
    return map;
  }, [scheduleCategories]);

  const authorOptions = useMemo<AuthorOption[]>(() => {
    const currentUserId = profileQuery.data?.id;
    return (membersQuery.data ?? []).map((member, index) => {
      const nickname = creatorNameById[member.userId] ?? '이름 없음';
      const isMe = member.userId === currentUserId;
      return {
        id: member.userId,
        label: isMe ? `${nickname} (나)` : nickname,
        color: AUTHOR_COLORS[index % AUTHOR_COLORS.length],
      };
    });
  }, [creatorNameById, membersQuery.data, profileQuery.data?.id]);

  const filteredExpenses = useMemo(() => {
    const expenses = (transactionsQuery.data ?? []).filter(
      (transaction) => transaction.type === 'expense',
    );

    if (authorFilter === 'all') {
      return expenses;
    }

    return expenses.filter(
      (transaction) => transaction.createdBy === authorFilter,
    );
  }, [authorFilter, transactionsQuery.data]);

  const filteredSchedules = useMemo(() => {
    const schedules = schedulesQuery.data ?? [];

    if (authorFilter === 'all') {
      return schedules;
    }

    return schedules.filter((schedule) => schedule.createdBy === authorFilter);
  }, [authorFilter, schedulesQuery.data]);

  const expenseTotalByDayKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const transaction of filteredExpenses) {
      const key = toDayKey(new Date(transaction.transactionDt));
      map.set(key, (map.get(key) ?? 0) + transaction.amount);
    }
    return map;
  }, [filteredExpenses]);

  const selectedDayKey = toDayKey(selectedDay);
  const selectedSchedules = useMemo(
    () =>
      filteredSchedules.filter((schedule) =>
        scheduleOverlapsDay(schedule, selectedDay),
      ),
    [filteredSchedules, selectedDay],
  );
  const selectedExpenses = useMemo(
    () =>
      filteredExpenses.filter(
        (transaction) =>
          toDayKey(new Date(transaction.transactionDt)) === selectedDayKey,
      ),
    [filteredExpenses, selectedDayKey],
  );

  const moveToMonth = (nextMonth: Date) => {
    setSelectedMonth(nextMonth);
    setSelectedDay((current) => {
      if (isSameMonth(current, nextMonth)) {
        return current;
      }

      const today = startOfDay(new Date());
      if (isSameMonth(today, nextMonth)) {
        return today;
      }

      return startOfMonth(nextMonth);
    });
  };

  const goPrevMonth = () => {
    moveToMonth(shiftMonth(selectedMonth, -1));
  };

  const goNextMonth = () => {
    moveToMonth(shiftMonth(selectedMonth, 1));
  };

  const goPrevYear = () => {
    moveToMonth(shiftYear(selectedMonth, -1));
  };

  const goNextYear = () => {
    moveToMonth(shiftYear(selectedMonth, 1));
  };

  const selectDay = (date: Date) => {
    const nextDay = startOfDay(date);
    if (
      isSameDay(nextDay, selectedDay) &&
      isSameMonth(nextDay, selectedMonth)
    ) {
      return;
    }

    if (!isSameMonth(nextDay, selectedMonth)) {
      setSelectedMonth(startOfMonth(nextDay));
    }
    setSelectedDay(nextDay);
  };

  const openCreateSchedule = () => {
    setScheduleFormMode({ type: 'create', date: selectedDay });
  };

  const openEditSchedule = (schedule: Schedule) => {
    setScheduleFormMode({ type: 'edit', schedule });
  };

  const closeScheduleForm = () => {
    setScheduleFormMode(null);
  };

  const requestDeleteSchedule = (schedule: Schedule) => {
    setScheduleFormMode(null);
    setDeletingSchedule(schedule);
  };

  const closeDeleteSchedule = () => {
    setDeletingSchedule(null);
  };

  const isLoading =
    transactionsQuery.isLoading ||
    schedulesQuery.isLoading ||
    membersQuery.isLoading ||
    categoriesQuery.isLoading;

  const error =
    transactionsQuery.error ??
    schedulesQuery.error ??
    membersQuery.error ??
    categoriesQuery.error;

  return {
    selectedMonth,
    selectedDay,
    days,
    showExpenses,
    authorFilter,
    authorOptions,
    authorColorById,
    creatorNameById,
    scheduleCategories,
    categoryColorById,
    expenseTotalByDayKey,
    filteredSchedules,
    selectedSchedules,
    selectedExpenses,
    scheduleFormMode,
    deletingSchedule,
    isLoading,
    error,
    goPrevMonth,
    goNextMonth,
    goPrevYear,
    goNextYear,
    selectDay,
    setShowExpenses,
    setAuthorFilter,
    openCreateSchedule,
    openEditSchedule,
    closeScheduleForm,
    requestDeleteSchedule,
    closeDeleteSchedule,
  };
};

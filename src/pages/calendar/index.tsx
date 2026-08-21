'use client';

import { useEffect, useState } from 'react';

import { HouseholdPageTitle, useCurrentHousehold } from '@/features/household';

import { useCalendarPage } from './model/useCalendarPage';
import { CalendarGrid } from './ui/CalendarGrid';
import { CalendarSidebar } from './ui/CalendarSidebar';
import { CalendarToolbar } from './ui/CalendarToolbar';
import { DayDetailPanel } from './ui/DayDetailPanel';
import { ScheduleDeleteConfirm } from './ui/ScheduleDeleteConfirm';
import { ScheduleForm } from './ui/ScheduleForm';
import styles from './ui/calendar.module.css';

type Props = {
  householdId: string;
};

const CalendarContent = ({ householdId }: Props) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const {
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
  } = useCalendarPage(householdId);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 48rem)');
    const handleChange = () => {
      if (media.matches) {
        setFilterOpen(false);
      }
    };

    media.addEventListener('change', handleChange);
    return () => {
      media.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    if (!filterOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFilterOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [filterOpen]);

  return (
    <>
      <CalendarToolbar
        selectedMonth={selectedMonth}
        filterOpen={filterOpen}
        onPrevMonth={goPrevMonth}
        onNextMonth={goNextMonth}
        onPrevYear={goPrevYear}
        onNextYear={goNextYear}
        onToggleFilter={() => setFilterOpen((current) => !current)}
      />

      {isLoading ? <p className={styles.empty}>불러오는 중…</p> : null}

      {error ? (
        <p className={styles.error}>
          {error instanceof Error
            ? error.message
            : '달력 정보를 불러오지 못했습니다.'}
        </p>
      ) : null}

      <div className={styles.body}>
        <CalendarSidebar
          householdId={householdId}
          open={filterOpen}
          showExpenses={showExpenses}
          authorFilter={authorFilter}
          authorOptions={authorOptions}
          categories={scheduleCategories}
          onToggleExpenses={setShowExpenses}
          onAuthorFilterChange={setAuthorFilter}
          onClose={() => setFilterOpen(false)}
        />

        {!isLoading && !error ? (
          <div className={styles.main}>
            <CalendarGrid
              month={selectedMonth}
              selectedDay={selectedDay}
              days={days}
              showExpenses={showExpenses}
              expenseTotalByDayKey={expenseTotalByDayKey}
              schedules={filteredSchedules}
              authorColorById={authorColorById}
              categoryColorById={categoryColorById}
              onSelectDay={selectDay}
              onSelectSchedule={openEditSchedule}
              onPrevMonth={goPrevMonth}
              onNextMonth={goNextMonth}
            />
            <DayDetailPanel
              selectedDay={selectedDay}
              showExpenses={showExpenses}
              schedules={selectedSchedules}
              expenses={selectedExpenses}
              creatorNameById={creatorNameById}
              authorColorById={authorColorById}
              categoryColorById={categoryColorById}
              onAddSchedule={openCreateSchedule}
              onSelectSchedule={openEditSchedule}
            />
          </div>
        ) : null}
      </div>

      {scheduleFormMode ? (
        <ScheduleForm
          householdId={householdId}
          categories={scheduleCategories}
          mode={scheduleFormMode}
          onCancel={closeScheduleForm}
          onSuccess={closeScheduleForm}
          onDelete={
            scheduleFormMode.type === 'edit'
              ? () => requestDeleteSchedule(scheduleFormMode.schedule)
              : undefined
          }
        />
      ) : null}

      {deletingSchedule ? (
        <ScheduleDeleteConfirm
          householdId={householdId}
          schedule={deletingSchedule}
          onCancel={closeDeleteSchedule}
          onSuccess={closeDeleteSchedule}
        />
      ) : null}
    </>
  );
};

export const CalendarPage = () => {
  const {
    householdId,
    isLoading: householdLoading,
    error: householdError,
  } = useCurrentHousehold();

  return (
    <main className={styles.page}>
      <HouseholdPageTitle subtitle="일정과 지출을 한눈에 확인하세요." />

      {householdLoading ? <p className={styles.empty}>불러오는 중…</p> : null}

      {householdError ? (
        <p className={styles.error}>
          {householdError instanceof Error
            ? householdError.message
            : '가계부 정보를 불러오지 못했습니다.'}
        </p>
      ) : null}

      {!householdLoading && !householdId ? (
        <p className={styles.empty}>확인할 가계부를 선택해 주세요.</p>
      ) : null}

      {householdId ? (
        <CalendarContent key={householdId} householdId={householdId} />
      ) : null}
    </main>
  );
};

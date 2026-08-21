'use client';

import { HouseholdPageTitle, useCurrentHousehold } from '@/features/household';

import { useCalendarPage } from './model/useCalendarPage';
import { CalendarGrid } from './ui/CalendarGrid';
import { CalendarToolbar } from './ui/CalendarToolbar';
import { DayDetailPanel } from './ui/DayDetailPanel';
import { ScheduleDeleteConfirm } from './ui/ScheduleDeleteConfirm';
import { ScheduleForm } from './ui/ScheduleForm';
import styles from './ui/calendar.module.css';

type Props = {
  householdId: string;
};

const CalendarContent = ({ householdId }: Props) => {
  const {
    selectedMonth,
    selectedDay,
    days,
    showExpenses,
    authorFilter,
    authorOptions,
    authorColorById,
    creatorNameById,
    expenseTotalByDayKey,
    schedulesByDayKey,
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

  return (
    <>
      <CalendarToolbar
        selectedMonth={selectedMonth}
        showExpenses={showExpenses}
        authorFilter={authorFilter}
        authorOptions={authorOptions}
        onPrevMonth={goPrevMonth}
        onNextMonth={goNextMonth}
        onPrevYear={goPrevYear}
        onNextYear={goNextYear}
        onToggleExpenses={setShowExpenses}
        onAuthorFilterChange={setAuthorFilter}
      />

      {isLoading ? <p className={styles.empty}>불러오는 중…</p> : null}

      {error ? (
        <p className={styles.error}>
          {error instanceof Error
            ? error.message
            : '달력 정보를 불러오지 못했습니다.'}
        </p>
      ) : null}

      {!isLoading && !error ? (
        <>
          <CalendarGrid
            month={selectedMonth}
            selectedDay={selectedDay}
            days={days}
            showExpenses={showExpenses}
            expenseTotalByDayKey={expenseTotalByDayKey}
            schedulesByDayKey={schedulesByDayKey}
            authorColorById={authorColorById}
            onSelectDay={selectDay}
            onPrevMonth={goPrevMonth}
            onNextMonth={goNextMonth}
            onPrevYear={goPrevYear}
            onNextYear={goNextYear}
          />
          <DayDetailPanel
            selectedDay={selectedDay}
            showExpenses={showExpenses}
            schedules={selectedSchedules}
            expenses={selectedExpenses}
            creatorNameById={creatorNameById}
            authorColorById={authorColorById}
            onAddSchedule={openCreateSchedule}
            onSelectSchedule={openEditSchedule}
          />
        </>
      ) : null}

      {scheduleFormMode ? (
        <ScheduleForm
          householdId={householdId}
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

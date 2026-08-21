export type UpdateScheduleReq = {
  id: number;
  householdId?: string;
  title?: string;
  startAt?: string;
  endAt?: string;
  memo?: string | null;
  categoryId?: number | null;
};

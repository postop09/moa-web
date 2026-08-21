export type CreateScheduleReq = {
  householdId: string;
  title: string;
  startAt: string;
  endAt: string;
  createdBy: string;
  memo?: string | null;
  categoryId?: number | null;
};

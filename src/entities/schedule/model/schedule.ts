export type Schedule = {
  id: number;
  householdId: string;
  title: string;
  memo: string | null;
  startAt: string;
  endAt: string;
  createdBy: string;
  createdDt: string;
  updatedDt: string;
};

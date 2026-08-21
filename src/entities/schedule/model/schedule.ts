export type Schedule = {
  id: number;
  householdId: string;
  title: string;
  memo: string | null;
  startAt: string;
  endAt: string;
  categoryId: number | null;
  createdBy: string;
  createdDt: string;
  updatedDt: string;
};

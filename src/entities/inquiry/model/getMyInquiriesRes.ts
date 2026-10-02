import type { Inquiry } from './inquiry';

export type GetMyInquiriesRes = {
  items: Inquiry[];
  nextPage: number | null;
};

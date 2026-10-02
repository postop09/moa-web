import type { InquiryStatusFilter } from '@/entities/inquiry';

const STATUSES: readonly InquiryStatusFilter[] = [
  'all',
  'waiting',
  'answered',
  'closed',
];

const isStatus = (value: unknown): value is InquiryStatusFilter =>
  STATUSES.some((status) => status === value);

/** ?status= 값을 검증한다. 같은 키가 여러 번 오면 첫 값만 보고, 알 수 없는 값은 all. */
export const parseStatusParam = (
  value: string | string[] | undefined,
): InquiryStatusFilter => {
  const first = Array.isArray(value) ? value[0] : value;

  return isStatus(first) ? first : 'all';
};

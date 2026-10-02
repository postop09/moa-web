import type { InquiryStatusFilter } from '@/entities/inquiry';

export const STATUS_TABS: readonly {
  status: InquiryStatusFilter;
  label: string;
}[] = [
  { status: 'all', label: '전체' },
  { status: 'waiting', label: '답변 대기' },
  { status: 'answered', label: '답변 완료' },
  { status: 'closed', label: '종결' },
];

export const INQUIRIES_PATH = '/support/inquiries';

export const getStatusPath = (status: InquiryStatusFilter) =>
  status === 'all' ? INQUIRIES_PATH : `${INQUIRIES_PATH}?status=${status}`;

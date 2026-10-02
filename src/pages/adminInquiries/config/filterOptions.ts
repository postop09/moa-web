import {
  ADMIN_INQUIRY_PERIODS,
  type AdminInquiryFilters,
  type AdminInquiryPeriodDays,
} from '@/entities/admin';
import { getAdminStatusLabel } from '@/entities/inquiry';
import type { InquiryStatus } from '@/entities/inquiry';
import { INQUIRY_STATUSES } from '@/shared/model';

export const ADMIN_INQUIRIES_PATH = '/admin/inquiries';

export const STATUS_OPTIONS: { value: InquiryStatus; label: string }[] =
  INQUIRY_STATUSES.map((value) => ({
    value,
    label: getAdminStatusLabel(value),
  }));

export const PERIOD_OPTIONS: {
  value: AdminInquiryPeriodDays;
  param: string;
  label: string;
}[] = [
  ...ADMIN_INQUIRY_PERIODS.map((days) => ({
    value: days,
    param: String(days),
    label: `최근 ${days}일`,
  })),
  { value: null, param: 'all', label: '전체' },
];

/** 결과 안내(role="status")에서 읽는 정렬 이름. */
export const SORT_LABELS: Record<
  AdminInquiryFilters['sort'],
  Record<AdminInquiryFilters['sortDir'], string>
> = {
  waiting: {
    asc: '답변 대기 먼저 · 오래 기다린 순',
    desc: '답변 대기 먼저 · 최근 대기 순',
  },
  confidence: { asc: '신뢰도 낮은 순', desc: '신뢰도 높은 순' },
  createdAt: { asc: '접수 오래된 순', desc: '접수 최신 순' },
};

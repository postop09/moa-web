import { INQUIRY_CATEGORIES, INQUIRY_STATUSES } from '@/shared/model';
import type { InquiryStatus } from '@/shared/model';

import type {
  AdminInquiryFilters,
  AdminInquiryPageSize,
  AdminInquiryPeriodDays,
  AdminInquirySort,
} from '../model/adminInquiryFilters';

type SearchParams = Record<string, string | string[] | undefined>;

const SORTS: AdminInquirySort[] = ['waiting', 'confidence', 'createdAt'];

/** 화면에서 고를 수 있는 페이지 크기. */
export const ADMIN_INQUIRY_PAGE_SIZES: AdminInquiryPageSize[] = [20, 50, 100];
/** 화면에서 고를 수 있는 기간(일). 전체 기간은 null 이라 포함하지 않는다. */
export const ADMIN_INQUIRY_PERIODS: (7 | 30 | 90)[] = [7, 30, 90];
/** 키워드 검색이 적용되는 최소 길이. */
export const ADMIN_INQUIRY_KEYWORD_MIN = 2;

const OPEN_STATUSES: InquiryStatus[] = ['waiting', 'in_progress'];

export const DEFAULT_ADMIN_INQUIRY_FILTERS: AdminInquiryFilters = {
  statuses: ['waiting', 'in_progress'],
  category: null,
  uncategorizedOnly: false,
  periodDays: null,
  keyword: '',
  sort: 'waiting',
  sortDir: 'asc',
  page: 1,
  pageSize: 20,
};

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const parseStatuses = (value: string | undefined): InquiryStatus[] => {
  const requested = new Set((value ?? '').split(','));
  const statuses = INQUIRY_STATUSES.filter((status) => requested.has(status));

  return statuses.length > 0
    ? statuses
    : [...DEFAULT_ADMIN_INQUIRY_FILTERS.statuses];
};

/** 열린 상태(대기·처리 중)만 보면 전체 기간, 완료 상태가 섞이면 최근 30일이 기본이다. */
const getDefaultPeriod = (statuses: InquiryStatus[]): AdminInquiryPeriodDays =>
  statuses.every((status) => OPEN_STATUSES.includes(status)) ? null : 30;

const parsePeriod = (
  value: string | undefined,
  statuses: InquiryStatus[],
): AdminInquiryPeriodDays => {
  if (value === 'all') return null;

  const found = ADMIN_INQUIRY_PERIODS.find((days) => String(days) === value);

  return found ?? getDefaultPeriod(statuses);
};

const parsePage = (value: string | undefined) => {
  if (!value || !/^\d+$/.test(value)) return 1;

  const page = Number(value);

  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
};

/** URL 쿼리를 어드민 문의 목록 필터로 읽는다. 알 수 없는 값은 기본값으로 되돌린다. */
export const parseAdminInquiryFilters = (
  params: SearchParams,
): AdminInquiryFilters => {
  const category = first(params.category);
  const sort = first(params.sort);
  const dir = first(params.dir);
  const size = Number(first(params.size));

  const statuses = parseStatuses(first(params.status));

  return {
    statuses,
    category:
      INQUIRY_CATEGORIES.find((candidate) => candidate === category) ?? null,
    uncategorizedOnly: first(params.uncategorized) === '1',
    periodDays: parsePeriod(first(params.period), statuses),
    keyword: (first(params.q) ?? '').trim(),
    sort: SORTS.find((candidate) => candidate === sort) ?? 'waiting',
    sortDir: dir === 'desc' ? 'desc' : 'asc',
    page: parsePage(first(params.page)),
    pageSize:
      ADMIN_INQUIRY_PAGE_SIZES.find((candidate) => candidate === size) ?? 20,
  };
};

/** 기본값과 다른 항목만 쿼리 문자열(? 없이)로 만든다. */
export const serializeAdminInquiryFilters = (
  filters: AdminInquiryFilters,
): string => {
  const defaults = DEFAULT_ADMIN_INQUIRY_FILTERS;
  const query = new URLSearchParams();
  const statuses = filters.statuses.join(',');

  if (statuses && statuses !== defaults.statuses.join(',')) {
    query.set('status', statuses);
  }
  if (filters.category) query.set('category', filters.category);
  if (filters.uncategorizedOnly) query.set('uncategorized', '1');
  if (filters.periodDays !== getDefaultPeriod(filters.statuses)) {
    query.set(
      'period',
      filters.periodDays === null ? 'all' : String(filters.periodDays),
    );
  }
  if (filters.keyword) query.set('q', filters.keyword);
  if (filters.sort !== defaults.sort) query.set('sort', filters.sort);
  if (filters.sortDir !== defaults.sortDir) query.set('dir', filters.sortDir);
  if (filters.page > 1) query.set('page', String(filters.page));
  if (filters.pageSize !== defaults.pageSize) {
    query.set('size', String(filters.pageSize));
  }

  return query.toString();
};

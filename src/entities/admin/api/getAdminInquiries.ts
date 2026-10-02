import type { SupabaseClient } from '@/shared/api';

import { ADMIN_INQUIRY_KEYWORD_MIN } from '../lib/parseAdminInquiryFilters';
import type { AdminInquiryFilters } from '../model/adminInquiryFilters';
import type {
  AdminInquiryListItem,
  GetAdminInquiriesRes,
} from '../model/adminInquiryListItem';

const DAY_MS = 24 * 60 * 60 * 1000;

type Row = AdminInquiryListItem & { totalCount: number | string };

// totalCount 는 목록 전체 값이라 항목에는 남기지 않는다.
const toListItem = (row: Row): AdminInquiryListItem => ({
  id: row.id,
  title: row.title,
  status: row.status,
  category: row.category,
  categoryConfidence: row.categoryConfidence,
  waitingSince: row.waitingSince,
  createdAt: row.createdAt,
  assigneeId: row.assigneeId,
  assigneeEmail: row.assigneeEmail,
});

export const getAdminInquiries = async (
  supabase: SupabaseClient,
  filters: AdminInquiryFilters,
  now: number = Date.now(),
): Promise<GetAdminInquiriesRes> => {
  const keyword = filters.keyword.trim();

  const { data, error } = await supabase.rpc('admin_list_inquiries', {
    p_statuses: filters.statuses,
    p_category: filters.category,
    p_uncategorized_only: filters.uncategorizedOnly,
    p_since:
      filters.periodDays === null
        ? null
        : new Date(now - filters.periodDays * DAY_MS).toISOString(),
    p_keyword: keyword.length >= ADMIN_INQUIRY_KEYWORD_MIN ? keyword : null,
    p_sort: filters.sort,
    p_sort_dir: filters.sortDir,
    p_limit: filters.pageSize,
    p_offset: (filters.page - 1) * filters.pageSize,
  });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Row[];

  if (rows.length === 0) {
    return { items: [], total: 0 };
  }

  return {
    items: rows.map(toListItem),
    total: Number(rows[0].totalCount),
  };
};

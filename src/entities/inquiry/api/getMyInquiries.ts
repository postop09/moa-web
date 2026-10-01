import type { SupabaseClient } from '@/shared/api';

import { INQUIRY_COLUMNS } from '../config/columns';
import { INQUIRY_PAGE_SIZE } from '../config/limits';
import { INQUIRY_TABLE } from '../config/tableName';
import type { GetMyInquiriesReq } from '../model/getMyInquiriesReq';
import type { GetMyInquiriesRes } from '../model/getMyInquiriesRes';
import type { Inquiry } from '../model/inquiry';

export const getMyInquiries = async (
  supabase: SupabaseClient,
  { userId, page, status = 'all' }: GetMyInquiriesReq,
): Promise<GetMyInquiriesRes> => {
  const from = page * INQUIRY_PAGE_SIZE;
  // 다음 페이지 존재 여부 확인을 위해 1건 더 조회한다
  const to = from + INQUIRY_PAGE_SIZE;

  let query = supabase
    .from(INQUIRY_TABLE)
    .select(INQUIRY_COLUMNS)
    // RLS가 본인 행만 허용하지만 의도를 드러내기 위해 명시적으로도 필터링한다
    .eq('userId', userId);

  if (status === 'waiting') {
    query = query.in('status', ['waiting', 'in_progress']);
  } else if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query
    .order('hasUnreadReply', { ascending: false })
    .order('createdAt', { ascending: false })
    // createdAt 이 같아도 페이지 경계에서 행이 겹치거나 빠지지 않도록 고정한다
    .order('id', { ascending: false })
    .range(from, to);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Inquiry[];
  const hasMore = rows.length > INQUIRY_PAGE_SIZE;

  return {
    items: hasMore ? rows.slice(0, INQUIRY_PAGE_SIZE) : rows,
    nextPage: hasMore ? page + 1 : null,
  };
};

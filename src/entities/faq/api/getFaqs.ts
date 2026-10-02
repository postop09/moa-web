import type { SupabaseClient } from '@/shared/api';

import { FAQ_DEFAULT_LIMIT } from '../config/limits';
import { FAQ_TABLE } from '../config/tableName';
import type { Faq } from '../model/faq';

/** category를 생략하면 전체를 반환한다. 도움됨 많은 순, 같으면 sortOrder 순. */
export const getFaqs = async (
  supabase: SupabaseClient,
  category?: string,
  limit: number = FAQ_DEFAULT_LIMIT,
): Promise<Faq[]> => {
  let query = supabase.from(FAQ_TABLE).select('*');

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query
    .order('helpfulCount', { ascending: false })
    .order('sortOrder', { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
};

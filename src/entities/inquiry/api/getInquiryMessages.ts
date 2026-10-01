import type { SupabaseClient } from '@/shared/api';

import { INQUIRY_MESSAGE_COLUMNS } from '../config/columns';
import { INQUIRY_MESSAGE_TABLE } from '../config/tableName';
import type { InquiryMessage } from '../model/inquiryMessage';

export const getInquiryMessages = async (
  supabase: SupabaseClient,
  inquiryId: string,
): Promise<InquiryMessage[]> => {
  const { data, error } = await supabase
    .from(INQUIRY_MESSAGE_TABLE)
    .select(INQUIRY_MESSAGE_COLUMNS)
    .eq('inquiryId', inquiryId)
    .order('createdAt', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
};

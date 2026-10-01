import type { SupabaseClient } from '@/shared/api';

import { INQUIRY_BUCKET } from '../config/tableName';

/**
 * DB cascade는 Storage 객체를 지우지 않으므로 별도로 정리해야 한다.
 * 순서: deleteInquiry로 DB 행을 먼저 지운 뒤 이 함수를 best-effort로 호출한다
 * (실패해도 고아 파일이 남을 뿐, 스레드가 깨지는 것보다 낫다. 호출부는 에러를 삼켜도 된다).
 * 제출되지 않은 임시 업로드(draft)는 DB에 경로가 없어 고아가 될 수 있으므로,
 * 제출 실패/취소 시 호출부에서 직접 이 함수로 정리해야 한다.
 */
export const deleteInquiryAttachments = async (
  supabase: SupabaseClient,
  paths: string[],
): Promise<void> => {
  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(INQUIRY_BUCKET).remove(paths);

  if (error) {
    throw error;
  }
};

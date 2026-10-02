import type { SupabaseClient } from '@/shared/api';

import { INQUIRY_BUCKET } from '../config/tableName';

/**
 * DB cascade는 Storage 객체를 지우지 않으므로 별도로 정리해야 한다.
 * 호출부는 DB 행을 먼저 지운 뒤 이 함수를 best-effort로 부른다.
 * 실패하면 throw하며, 호출부는 실패가 확실하지 않은 경우(요청이 서버에 닿았는지 알 수 없는 경우)에는
 * 파일을 지우지 않고 남긴다. 그러면 DB가 참조하는 파일을 잃는 일은 없지만 고아 파일이 남을 수 있다.
 * 고아 파일 정리는 서버 측 작업이 필요하다(알려진 후속 과제). 클라이언트 정리는 최선의 시도일 뿐이다.
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

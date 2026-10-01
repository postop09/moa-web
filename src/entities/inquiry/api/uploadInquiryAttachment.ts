import type { SupabaseClient } from '@/shared/api';

import { INQUIRY_BUCKET } from '../config/tableName';
import type { UploadInquiryAttachmentReq } from '../model/uploadInquiryAttachmentReq';

/**
 * 업로드된 파일의 스토리지 경로를 반환한다.
 * 문의 id는 업로드 시점에 아직 없을 수 있어(RPC가 id를 생성) 경로의 두 번째 구간은
 * 호출자가 만든 folderId를 쓴다. RPC와 Storage 정책은 `{userId}/` 접두사만 검증한다.
 */
export const uploadInquiryAttachment = async (
  supabase: SupabaseClient,
  { userId, folderId, file }: UploadInquiryAttachmentReq,
): Promise<string> => {
  const ext = file.name.includes('.')
    ? file.name.split('.').pop()!.toLowerCase()
    : 'jpg';
  const path = `${userId}/${folderId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(INQUIRY_BUCKET)
    .upload(path, file, { contentType: file.type || undefined });

  if (error) {
    throw error;
  }

  return path;
};

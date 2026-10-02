/**
 * 사용자(authenticated)에게 SELECT 가 허용된 컬럼 목록.
 * DB 에서 컬럼 단위로만 GRANT 하므로 select('*') 는 permission denied 가 된다.
 * 마이그레이션(20261001000100)의 GRANT 목록과 항상 같아야 한다.
 */
export const INQUIRY_COLUMNS =
  'id, userId, title, status, category, deviceInfo, hasUnreadReply, rating, waitingSince, createdAt, updatedAt';

export const INQUIRY_MESSAGE_COLUMNS =
  'id, inquiryId, kind, body, attachments, createdAt';

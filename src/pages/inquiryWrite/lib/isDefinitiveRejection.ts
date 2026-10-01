import { getErrorCode, getErrorMessage } from '@/shared/lib';

const REJECTION_MESSAGE_PATTERN =
  /^(invalid_|forbidden|not_found|unauthorized|conflict|uncategorized|already_rated)/;

/**
 * 서버가 요청을 확정적으로 거절했는지. 거절이면 DB 에 아무것도 남지 않았으므로
 * 올려 둔 첨부를 정리해도 안전하다. 네트워크/알 수 없는 오류는 서버가 처리했을 수도
 * 있어 false 로 두고 파일을 지키지 않는다(재시도 시 고아 파일이 남을 수는 있다).
 */
export const isDefinitiveRejection = (error: unknown) =>
  getErrorCode(error) !== null ||
  REJECTION_MESSAGE_PATTERN.test(getErrorMessage(error, ''));

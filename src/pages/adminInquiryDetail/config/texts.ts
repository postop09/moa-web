export const ADMIN_INQUIRIES_PATH = '/admin/inquiries';

export const PAGE_TITLE = '문의 상세';
export const LOAD_ERROR_TEXT = '문의를 불러오지 못했어요. 다시 시도해주세요.';
export const NOT_FOUND_TEXT = '문의를 찾을 수 없어요.';
export const THREAD_ERROR_TEXT = '대화 내용을 불러오지 못했어요.';
export const PERMISSION_TEXT =
  '권한이 없거나 로그인이 만료됐어요. 다시 로그인해주세요.';
export const NETWORK_TEXT = '연결을 확인하고 다시 시도해주세요.';
export const INVALID_STATE_TEXT = '이미 종결된 문의예요.';

export const SUBMIT_FAILURE_TEXT = '등록하지 못했어요. 다시 시도해주세요.';
export const UPLOAD_FAILURE_TEXT =
  '사진 업로드에 실패했어요. 다시 시도해주세요.';
export const CONFLICT_TEXT =
  '다른 운영자가 먼저 답변했어요. 내용을 확인해주세요.';
export const UNCATEGORIZED_TEXT = '카테고리를 먼저 지정해주세요.';
export const PANEL_FAILURE_TEXT = '변경하지 못했어요. 다시 시도해주세요.';
export const CLOSE_FAILURE_TEXT = '종결하지 못했어요. 다시 시도해주세요.';

export const PEEK_NOTE_TEXT =
  '미리보기로 열었어요. 담당자는 지정되지 않았어요.';
export const PEEK_HINT_TEXT = '담당하려면 "상태·담당자" 영역에서 지정하세요.';
export const OPEN_FAILURE_TEXT =
  '담당자 지정에 실패했어요. 담당자에서 직접 지정하세요.';
export const MESSAGES_PENDING_HINT = '대화 내용을 불러온 뒤 등록할 수 있어요';
export const REPLY_SENT_ANNOUNCEMENT = '답변을 등록했어요';
export const MEMO_SAVED_ANNOUNCEMENT = '메모를 저장했어요';
export const CLAIM_ANNOUNCEMENT = '처리 중으로 바꾸고 내가 담당했어요';
export const REFETCHING_HINT = '최신 내용을 불러오는 중이에요';
export const CONFLICT_FOLLOW_UP_TEXT =
  '새 답변이 등록됐어요. 내용을 확인한 뒤 등록하세요.';
export const REPLY_PANEL_NOTE = '사용자 앱의 문의 내역에 표시돼요';
export const MEMO_PANEL_NOTE = '운영자끼리만 볼 수 있어요';
export const UNCATEGORIZED_BANNER_TEXT =
  '카테고리를 먼저 지정해야 답변할 수 있어요';
export const STATUS_ASSIGNEE_SAVED_ANNOUNCEMENT = '상태·담당자를 저장했어요';
export const STATUS_ASSIGNEE_SAVED_TEXT = '저장했어요';
export const STATUS_ASSIGNEE_DIRTY_TEXT = '저장하지 않은 변경이 있어요';
export const STATUS_ASSIGNEE_RESET_TEXT =
  '다른 곳에서 변경돼 입력을 초기화했어요';
/** "저장했어요" 가 사라지기까지의 시간(ms). */
export const SAVED_FEEDBACK_MS = 4000;

/** 사용자 문의 / 추가 문의 첨부 사진 버튼 이름의 소유자 표기. */
export const QUESTION_PHOTO_OWNER = '사용자 문의';
export const REPLY_PHOTO_OWNER = '운영자 답변';

export const CLOSE_REASONS = [
  '중복 문의',
  '스팸·광고',
  '테스트',
  '기타',
] as const;
export const CLOSE_REASON_OTHER = '기타';
export const CLOSE_REASON_MAX = 500;
export const BODY_MAX = 2000;

export type InquiryCategory =
  | 'shared_household'
  | 'record_category'
  | 'stats_screen'
  | 'account_login'
  | 'bug_report'
  | 'feature_request'
  | 'other';

export const INQUIRY_CATEGORY_LABELS: Record<InquiryCategory, string> = {
  shared_household: '공유 가계부',
  record_category: '기록·카테고리',
  stats_screen: '통계·화면',
  account_login: '계정·로그인',
  bug_report: '오류 신고',
  feature_request: '기능 제안',
  other: '기타',
};

export const INQUIRY_CATEGORIES = Object.keys(
  INQUIRY_CATEGORY_LABELS,
) as InquiryCategory[];

/** category가 null이면 미분류. 사용자에게는 '접수됨'으로 노출한다. */
export const UNCATEGORIZED_USER_LABEL = '접수됨';

export const getInquiryCategoryLabel = (
  category: InquiryCategory | null,
): string =>
  category ? INQUIRY_CATEGORY_LABELS[category] : UNCATEGORIZED_USER_LABEL;

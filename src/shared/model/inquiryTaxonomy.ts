export type InquiryCategory =
  | 'shared_household'
  | 'record_category'
  | 'stats_screen'
  | 'account_login'
  | 'bug_report'
  | 'feature_request'
  | 'other';

export const INQUIRY_CATEGORIES: InquiryCategory[] = [
  'shared_household',
  'record_category',
  'stats_screen',
  'account_login',
  'bug_report',
  'feature_request',
  'other',
];

export type InquiryStatus = 'waiting' | 'in_progress' | 'answered' | 'closed';

export const INQUIRY_STATUSES: InquiryStatus[] = [
  'waiting',
  'in_progress',
  'answered',
  'closed',
];

export type TransactionType = 'income' | 'expense' | 'saving' | 'insurance';

export const TRANSACTION_TYPE_LABEL = {
  income: '수입',
  expense: '지출',
  saving: '저축',
  insurance: '보험',
} as const satisfies Record<TransactionType, string>;

export const TRANSACTION_TYPE_COLOR = {
  income: '#2563EB',
  expense: '#DC2626',
  saving: '#16a34a',
  insurance: '#EA580C',
} as const satisfies Record<TransactionType, string>;

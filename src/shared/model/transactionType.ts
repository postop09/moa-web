export type TransactionType = 'income' | 'expense' | 'saving';

export const TRANSACTION_TYPE_LABEL = {
  income: '수입',
  expense: '지출',
  saving: '저축',
} as const satisfies Record<TransactionType, string>;

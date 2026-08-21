export type LedgerEventType = 'income' | 'expense' | 'saving';

export type LedgerEvent = {
  id: string;
  type: LedgerEventType;
  name: string;
  amount: number;
};

export type LedgerStoryStep = {
  id: string;
  title: string;
  description: string;
  figure: string | null;
  event: LedgerEvent | null;
  showBudgetViz: boolean;
};

export const LEDGER_STORY_STEPS: LedgerStoryStep[] = [
  {
    id: 'start',
    title: '빈 가계부에서 시작합니다',
    description: '스크롤하면 수입·지출·저축이 쌓이고 남은 예산이 바뀝니다.',
    figure: '0',
    event: null,
    showBudgetViz: false,
  },
  {
    id: 'salary',
    title: '월급 300만 원 입금',
    description: '수입이 들어오면 잔액이 바로 반영됩니다.',
    figure: '+300만',
    event: {
      id: 'salary',
      type: 'income',
      name: '월급',
      amount: 3_000_000,
    },
    showBudgetViz: false,
  },
  {
    id: 'food',
    title: '식비 50만 원',
    description: '지출이 생기면 잔액에서 빠집니다.',
    figure: '-50만',
    event: {
      id: 'food',
      type: 'expense',
      name: '식비',
      amount: 500_000,
    },
    showBudgetViz: false,
  },
  {
    id: 'transport',
    title: '교통비 10만 원',
    description: '작은 지출도 한 달의 흐름 안에서 보입니다.',
    figure: '-10만',
    event: {
      id: 'transport',
      type: 'expense',
      name: '교통비',
      amount: 100_000,
    },
    showBudgetViz: false,
  },
  {
    id: 'saving',
    title: '저축 100만 원',
    description: '저축은 따로 모아 남은 예산을 분명히 합니다.',
    figure: '+100만',
    event: {
      id: 'saving',
      type: 'saving',
      name: '저축',
      amount: 1_000_000,
    },
    showBudgetViz: false,
  },
  {
    id: 'remain',
    title: '남은 예산 140만 원',
    description: '수입에서 지출과 저축을 뺀 잔액을 그래프로 확인하세요.',
    figure: '140만',
    event: null,
    showBudgetViz: true,
  },
];

export type LedgerStoryState = {
  events: LedgerEvent[];
  income: number;
  expense: number;
  saving: number;
  balance: number;
  showBudgetViz: boolean;
};

export const getLedgerStateAtStep = (stepIndex: number): LedgerStoryState => {
  const clamped = Math.max(
    0,
    Math.min(stepIndex, LEDGER_STORY_STEPS.length - 1),
  );
  const events = LEDGER_STORY_STEPS.slice(0, clamped + 1)
    .map((step) => step.event)
    .filter((event): event is LedgerEvent => event !== null);

  const income = events
    .filter((event) => event.type === 'income')
    .reduce((sum, event) => sum + event.amount, 0);
  const expense = events
    .filter((event) => event.type === 'expense')
    .reduce((sum, event) => sum + event.amount, 0);
  const saving = events
    .filter((event) => event.type === 'saving')
    .reduce((sum, event) => sum + event.amount, 0);

  return {
    events,
    income,
    expense,
    saving,
    balance: income - expense - saving,
    showBudgetViz: LEDGER_STORY_STEPS[clamped]?.showBudgetViz ?? false,
  };
};

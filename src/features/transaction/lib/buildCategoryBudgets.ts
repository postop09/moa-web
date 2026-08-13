import type { Category } from '@/entities/category';
import type { Transaction } from '@/entities/transaction';

export type CategoryBudget = {
  id: number;
  name: string;
  spent: number;
  budget: number | null;
  ratio: number | null;
};

export const buildCategoryBudgets = (
  transactions: Transaction[],
  categories: Category[],
): CategoryBudget[] => {
  const spentByCategoryId = new Map<number, number>();

  for (const transaction of transactions) {
    if (transaction.type !== 'expense' || transaction.categoryId === null) {
      continue;
    }

    spentByCategoryId.set(
      transaction.categoryId,
      (spentByCategoryId.get(transaction.categoryId) ?? 0) + transaction.amount,
    );
  }

  return categories
    .filter((category) => category.type === 'expense')
    .map((category) => {
      const spent = spentByCategoryId.get(category.id) ?? 0;
      const budget = category.budget;

      let ratio: number | null = null;
      if (budget !== null) {
        ratio =
          budget === 0
            ? spent > 0
              ? Number.POSITIVE_INFINITY
              : 0
            : spent / budget;
      }

      return {
        id: category.id,
        name: category.name,
        spent,
        budget,
        ratio,
      };
    })
    .sort((a, b) => {
      const ratioA = a.ratio ?? -1;
      const ratioB = b.ratio ?? -1;
      return ratioB - ratioA;
    });
};

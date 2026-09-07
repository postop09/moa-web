export type CategoryAmount = {
  name: string;
  amount: number;
};

export type CategorySeries = {
  name: string;
  data: number[];
};

export const buildCategorySeries = <T extends { byCategory: CategoryAmount[] }>(
  items: T[],
): CategorySeries[] => {
  const totals = new Map<string, number>();

  for (const item of items) {
    for (const category of item.byCategory) {
      totals.set(
        category.name,
        (totals.get(category.name) ?? 0) + category.amount,
      );
    }
  }

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => ({
      name,
      data: items.map((item) => {
        const matched = item.byCategory.find(
          (category) => category.name === name,
        );
        return matched?.amount ?? 0;
      }),
    }));
};

export const getMonthRange = (referenceDate = new Date()) => {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  const from = new Date(year, month, 1, 0, 0, 0, 0);
  const to = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
};

export const getTrailingMonthsRange = (
  monthCount: number,
  referenceDate = new Date(),
) => {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  const from = new Date(year, month - (monthCount - 1), 1, 0, 0, 0, 0);
  const to = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
};

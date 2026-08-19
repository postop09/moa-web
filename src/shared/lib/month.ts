export const startOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const shiftMonth = (date: Date, delta: number) => {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
};

export const isSameMonth = (a: Date, b: Date) => {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
};

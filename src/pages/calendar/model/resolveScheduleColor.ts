import type { Schedule } from '@/entities/schedule';

export const resolveScheduleColor = (
  schedule: Schedule,
  categoryColorById: Record<number, string>,
  authorColorById: Record<string, string>,
) => {
  if (schedule.categoryId !== null) {
    const categoryColor = categoryColorById[schedule.categoryId];
    if (categoryColor) {
      return categoryColor;
    }
  }

  return authorColorById[schedule.createdBy] ?? 'var(--color-accent)';
};

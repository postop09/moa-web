export const faqQueryKeys = {
  all: ['faqs'] as const,
  list: (category?: string) =>
    [...faqQueryKeys.all, 'list', category ?? 'all'] as const,
  search: (keyword: string) =>
    [...faqQueryKeys.all, 'search', keyword] as const,
};

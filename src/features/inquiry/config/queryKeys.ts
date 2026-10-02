export const inquiryQueryKeys = {
  all: ['inquiries'] as const,
  unreadCount: () => [...inquiryQueryKeys.all, 'unreadCount'] as const,
};

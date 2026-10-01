export const inquiryQueryKeys = {
  all: ['inquiries'] as const,
  list: () => [...inquiryQueryKeys.all, 'list'] as const,
  detail: (inquiryId: string) =>
    [...inquiryQueryKeys.all, 'detail', inquiryId] as const,
  messages: (inquiryId: string) =>
    [...inquiryQueryKeys.all, 'messages', inquiryId] as const,
  unreadCount: () => [...inquiryQueryKeys.all, 'unreadCount'] as const,
};

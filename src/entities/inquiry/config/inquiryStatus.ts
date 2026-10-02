import type { InquiryStatus } from '@/shared/model';

export type { InquiryStatus };

export const getUserStatusLabel = (status: InquiryStatus): string => {
  switch (status) {
    case 'waiting':
    case 'in_progress':
      return '답변 대기';
    case 'answered':
      return '답변 완료';
    case 'closed':
      return '종결';
  }
};

export const getAdminStatusLabel = (status: InquiryStatus): string => {
  switch (status) {
    case 'waiting':
      return '답변 대기';
    case 'in_progress':
      return '처리 중';
    case 'answered':
      return '답변 완료';
    case 'closed':
      return '종결';
  }
};

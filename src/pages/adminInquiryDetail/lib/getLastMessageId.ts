import type { AdminInquiryMessage } from '@/entities/admin';

/** 내부 메모를 뺀 마지막 메시지 id. 답변 등록의 충돌 검사 기준이다. */
export const getLastMessageId = (messages: AdminInquiryMessage[]) => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].kind !== 'memo') return messages[index].id;
  }

  return null;
};

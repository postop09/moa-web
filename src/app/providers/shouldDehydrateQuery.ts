import type { Query } from '@tanstack/react-query';

import { authQueryKeys } from '@/entities/auth';
import { adminQueryKeys } from '@/features/adminInquiry';
import { inquiryQueryKeys } from '@/features/inquiry';

// 읽는 필드만 받아 데이터 타입이 다른 Query 인스턴스(Query<never> 등)도 그대로 넘길 수 있게 한다.
type DehydrateCandidate = Pick<Query, 'queryKey' | 'state'>;

// 서명 URL 은 1시간 뒤 만료되므로 localStorage 로 영속화하면 다음 방문에 깨진 URL 이 복원된다.
const ATTACHMENT_URLS_SEGMENT = inquiryQueryKeys.attachmentUrls([])[1];

export const shouldDehydrateQuery = (query: DehydrateCandidate) =>
  query.state.status === 'success' &&
  query.queryKey[0] !== authQueryKeys.all[0] &&
  // 다른 사용자의 문의 제목·운영자 이메일이 담겨 있어 브라우저 저장소에 남기지 않는다.
  query.queryKey[0] !== adminQueryKeys.all[0] &&
  !(
    query.queryKey[0] === inquiryQueryKeys.all[0] &&
    query.queryKey[1] === ATTACHMENT_URLS_SEGMENT
  );

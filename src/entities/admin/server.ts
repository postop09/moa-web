import { notFound } from 'next/navigation';

import { createServerClient } from '@/shared/api/server';

import { getIsAdmin } from './api/getIsAdmin';

const describeError = (error: unknown): string => {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? (error as { code?: unknown }).code
      : undefined;

  if (typeof code === 'string' && code) return code;

  return error instanceof Error ? error.name : 'unknown';
};

/**
 * 서버 컴포넌트에서 운영자만 통과시킨다. 운영자가 아니거나(비로그인 포함) 확인에
 * 실패하면 존재 자체를 숨기기 위해 404 로 돌린다. 서버 전용이라 보조 진입점(server.ts)이다.
 */
export const requireAdmin = async (): Promise<void> => {
  let isAdmin = false;

  try {
    const supabase = await createServerClient();

    isAdmin = await getIsAdmin(supabase);
  } catch (error) {
    // 비관리자와 구분되는 확인 실패는 로그에 남긴다. 토큰·헤더가 섞일 수 있어 에러 코드(없으면 에러 이름)만 쓴다.
    console.error('requireAdmin: 운영자 확인 실패', describeError(error));
    isAdmin = false;
  }

  if (!isAdmin) {
    notFound();
  }
};

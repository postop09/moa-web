import { getAuthCompletePath } from '@/shared/lib';

type RouterLike = {
  replace: (href: string) => void;
};

export const redirectIfNoHouseholds = async (
  households: unknown[] | undefined,
  router: RouterLike,
) => {
  if (households?.length) {
    return false;
  }

  // 서버 액션으로 쿠키를 지우면 실패 시 홈↔온보딩 무한 루프가 생기므로,
  // /auth/complete Route Handler가 게이트를 재판별해 쿠키 삭제와 목적지를 응답에서 확정하게 한다.
  router.replace(getAuthCompletePath());
  return true;
};

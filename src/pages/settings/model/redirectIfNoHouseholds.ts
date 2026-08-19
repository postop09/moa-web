import { clearAuthGateReadyCookie } from '@/features/onboarding';

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

  try {
    await clearAuthGateReadyCookie();
  } catch {
    // 온보딩 페이지는 풀 게이트로 상태를 다시 판별함
  }

  router.replace('/onboarding/household');
  return true;
};

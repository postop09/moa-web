'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useCurrentHousehold } from '@/features/household';
import { redirectIfNoHouseholds } from '@/features/onboarding';

// widget이 domain 훅(useCurrentHousehold)을 직접 호출하는 것은 예외적인 형태다.
// 여러 페이지(app 전역)에 걸쳐 동작해야 하는 리다이렉트 로직이라 특정 pages에서
// props로 내려받기 어렵고, widgets → features 참조는 FSD 규칙상 허용되므로
// 이 컴포넌트에 한해 의도적으로 도메인 훅을 직접 사용한다.
export const NoHouseholdRedirect = () => {
  const router = useRouter();
  const { households, isHouseholdsSuccess } = useCurrentHousehold();

  useEffect(() => {
    if (!isHouseholdsSuccess) {
      return;
    }

    void redirectIfNoHouseholds(households, router);
  }, [households, isHouseholdsSuccess, router]);

  return null;
};

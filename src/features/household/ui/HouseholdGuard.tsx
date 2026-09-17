'use client';

import { Fragment, type ReactNode } from 'react';

import { getErrorMessage } from '@/shared/lib';

import { useCurrentHousehold } from '../model/useCurrentHousehold';
import styles from './householdGuard.module.css';

type Props = {
  emptyMessage?: string;
  errorFallbackMessage?: string;
  fallback?: ReactNode;
  children: (householdId: string) => ReactNode;
};

const DEFAULT_EMPTY_MESSAGE = '확인할 가계부를 선택해 주세요.';
const DEFAULT_ERROR_FALLBACK_MESSAGE = '가계부 정보를 불러오지 못했습니다.';

export const HouseholdGuard = ({
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  errorFallbackMessage = DEFAULT_ERROR_FALLBACK_MESSAGE,
  fallback,
  children,
}: Props) => {
  const { householdId, isLoading, error } = useCurrentHousehold();

  if (isLoading) {
    // 장식용(aria-hidden) fallback을 받아도 상태 안내가 빠지지 않게 status 리전과 숨김 텍스트로 감싼다.
    return fallback ? (
      <div role="status">
        <span className="srOnly">불러오는 중…</span>
        {fallback}
      </div>
    ) : (
      <p className={styles.empty} role="status">
        불러오는 중…
      </p>
    );
  }

  if (error) {
    return (
      <p className={styles.error} role="alert">
        {getErrorMessage(error, errorFallbackMessage)}
      </p>
    );
  }

  if (!householdId) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  // householdId가 바뀌면 하위 트리를 리마운트해 이전 가계부의 로컬 상태가 남지 않게 한다.
  return <Fragment key={householdId}>{children(householdId)}</Fragment>;
};

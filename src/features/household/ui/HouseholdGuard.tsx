'use client';

import { Fragment, type ReactNode } from 'react';

import { getErrorMessage } from '@/shared/lib';

import { useCurrentHousehold } from '../model/useCurrentHousehold';
import styles from './householdGuard.module.css';

type Props = {
  emptyMessage?: string;
  errorFallbackMessage?: string;
  children: (householdId: string) => ReactNode;
};

const DEFAULT_EMPTY_MESSAGE = '확인할 가계부를 선택해 주세요.';
const DEFAULT_ERROR_FALLBACK_MESSAGE = '가계부 정보를 불러오지 못했습니다.';

export const HouseholdGuard = ({
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  errorFallbackMessage = DEFAULT_ERROR_FALLBACK_MESSAGE,
  children,
}: Props) => {
  const { householdId, isLoading, error } = useCurrentHousehold();

  if (isLoading) {
    return <p className={styles.empty}>불러오는 중…</p>;
  }

  if (error) {
    return (
      <p className={styles.error}>
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

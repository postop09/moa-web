'use client';

import { useId, type RefObject } from 'react';

import type {
  AdminInquiry,
  AdminOperator,
  AdminRecentInquiry,
} from '@/entities/admin';

import { STATUS_ASSIGNEE_SAVED_ANNOUNCEMENT } from '../config/texts';
import { usePanelUpdate } from '../model/usePanelUpdate';

import { CategorySection } from './CategorySection';
import { CloseSection } from './CloseSection';
import { DeviceInfoSection } from './DeviceInfoSection';
import { RecentInquiriesSection } from './RecentInquiriesSection';
import styles from './sidePanel.module.css';
import { StatusAssigneeSection } from './StatusAssigneeSection';

type Props = {
  inquiry: AdminInquiry;
  operators: AdminOperator[] | undefined;
  isOperatorsError: boolean;
  recent: AdminRecentInquiry[] | undefined;
  isRecentError: boolean;
  categorySelectRef: RefObject<HTMLSelectElement | null>;
  announce: (message: string) => void;
  onClosed: () => void;
};

export const SidePanel = ({
  inquiry,
  operators,
  isOperatorsError,
  recent,
  isRecentError,
  categorySelectRef,
  announce,
  onClosed,
}: Props) => {
  const lockHintId = useId();
  const panel = usePanelUpdate({ inquiryId: inquiry.id, announce });
  const isLocked = inquiry.status === 'closed';

  return (
    <aside className={styles.panel} aria-label="문의 정보">
      <CategorySection
        inquiry={inquiry}
        isLocked={isLocked}
        lockHintId={lockHintId}
        isSaving={panel.isPending}
        selectRef={categorySelectRef}
        onSave={(category) =>
          panel.update({ category }, '카테고리를 변경했어요')
        }
      />
      <StatusAssigneeSection
        inquiry={inquiry}
        operators={operators}
        isLocked={isLocked}
        lockHintId={lockHintId}
        isSaving={panel.isPending}
        onSave={(change) =>
          panel.update(change, STATUS_ASSIGNEE_SAVED_ANNOUNCEMENT)
        }
        onCancel={panel.resetError}
      />
      {isLocked ? (
        <p id={lockHintId} className={styles.muted}>
          종결된 문의는 카테고리, 상태, 담당자를 바꿀 수 없어요
        </p>
      ) : null}
      {isOperatorsError ? (
        <p className={styles.muted}>운영자 목록을 불러오지 못했어요</p>
      ) : null}
      {panel.error ? (
        <p className={styles.panelError} role="alert">
          {panel.error}
        </p>
      ) : null}
      <DeviceInfoSection deviceInfo={inquiry.deviceInfo} />
      <RecentInquiriesSection items={recent} isError={isRecentError} />
      <CloseSection
        inquiryId={inquiry.id}
        isLocked={isLocked}
        lockHintId={lockHintId}
        announce={announce}
        onClosed={onClosed}
      />
    </aside>
  );
};

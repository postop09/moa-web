'use client';

import { useEffect, useRef, useState } from 'react';

import { useRestoreFocus } from '@/shared/lib';
import { Button } from '@/shared/ui';

import { useCloseAction } from '../model/useCloseAction';

import { CloseInquiryDialog } from './CloseInquiryDialog';
import styles from './sidePanel.module.css';

type Props = {
  inquiryId: string;
  isLocked: boolean;
  lockHintId: string;
  announce: (message: string) => void;
  /** 종결에 성공하고 대화상자가 닫힌 뒤 호출한다. */
  onClosed: () => void;
};

export const CloseSection = ({
  inquiryId,
  isLocked,
  lockHintId,
  announce,
  onClosed,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const closedRef = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const action = useCloseAction({
    inquiryId,
    onClosed: () => {
      setIsOpen(false);
      closedRef.current = true;
      announce('문의를 종결했어요');
    },
  });

  // 닫힌 뒤 기본 복귀 대상(종결 버튼)은 비활성이 되므로, 대화상자가 사라진 다음에 제목으로 포커스를 옮긴다.
  useRestoreFocus(isOpen, () => buttonRef.current);
  useEffect(() => {
    if (closedRef.current && !isOpen) {
      closedRef.current = false;
      onClosed();
    }
  }, [isOpen, onClosed]);

  const handleOpen = () => {
    if (isLocked) return;

    action.resetError();
    setIsOpen(true);
  };

  return (
    <>
      <Button
        ref={buttonRef}
        variant="secondary"
        fullWidth
        className={styles.closeButton}
        aria-disabled={isLocked}
        aria-describedby={isLocked ? lockHintId : undefined}
        onClick={handleOpen}
      >
        종결 처리
      </Button>
      {isOpen ? (
        <CloseInquiryDialog
          isPending={action.isPending}
          error={action.error}
          onCancel={() => setIsOpen(false)}
          onConfirm={(reason) => void action.close(reason)}
        />
      ) : null}
    </>
  );
};

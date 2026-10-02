'use client';

import { useRef } from 'react';

import { useAddAdminMemo } from '@/features/adminInquiry';

import { MEMO_SAVED_ANNOUNCEMENT, SUBMIT_FAILURE_TEXT } from '../config/texts';
import { getFailureMessage } from '../lib/getFailureMessage';
import { trimText } from '../lib/trimText';

type Props = {
  inquiryId: string;
  announce: (message: string) => void;
  /** 저장을 시작할 때(이전 안내를 지우는 데 쓴다). */
  onStart: () => void;
  onSaved: () => void;
  onFailure: (message: string) => void;
};

/** 내부 메모 저장. 한 번에 하나만 보낸다. 본문 길이 검사는 호출부가 한다. */
export const useMemoSave = ({
  inquiryId,
  announce,
  onStart,
  onSaved,
  onFailure,
}: Props) => {
  const { mutateAsync, isPending } = useAddAdminMemo();
  const busyRef = useRef(false);

  const save = async (body: string) => {
    const trimmed = trimText(body);

    if (trimmed === '' || busyRef.current) return;

    busyRef.current = true;
    onStart();
    announce('');

    try {
      await mutateAsync({ inquiryId, body: trimmed });
      onSaved();
      announce(MEMO_SAVED_ANNOUNCEMENT);
    } catch (error) {
      onFailure(getFailureMessage(error, SUBMIT_FAILURE_TEXT));
    } finally {
      busyRef.current = false;
    }
  };

  return { save, isSaving: isPending };
};

'use client';

import { useRef, useState } from 'react';

import type { UpdateAdminInquiryMetaReq } from '@/entities/admin';
import { useUpdateAdminInquiryMeta } from '@/features/adminInquiry';

import { PANEL_FAILURE_TEXT } from '../config/texts';
import { getFailureMessage } from '../lib/getFailureMessage';

type Change = Omit<UpdateAdminInquiryMetaReq, 'inquiryId'>;

type Props = {
  inquiryId: string;
  announce: (message: string) => void;
};

/** 사이드 패널의 카테고리·상태·담당자 저장. 한 번에 하나만 보내고 실패는 패널의 단일 안내로 모은다. */
export const usePanelUpdate = ({ inquiryId, announce }: Props) => {
  const { mutateAsync, isPending } = useUpdateAdminInquiryMeta();
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  /** 성공하면 true. 이미 보내는 중이거나 실패하면 false. */
  const update = async (change: Change, successMessage: string) => {
    if (busyRef.current) return false;

    busyRef.current = true;
    setError(null);
    announce('');

    try {
      await mutateAsync({ inquiryId, ...change });
      announce(successMessage);

      return true;
    } catch (failure) {
      setError(getFailureMessage(failure, PANEL_FAILURE_TEXT));

      return false;
    } finally {
      busyRef.current = false;
    }
  };

  return { update, error, isPending, resetError: () => setError(null) };
};

'use client';

import { useRef, useState } from 'react';

import { useCloseAdminInquiry } from '@/features/adminInquiry';

import { CLOSE_FAILURE_TEXT } from '../config/texts';
import { getFailureMessage } from '../lib/getFailureMessage';

type Props = {
  inquiryId: string;
  onClosed: () => void;
};

export const useCloseAction = ({ inquiryId, onClosed }: Props) => {
  const { mutateAsync, isPending } = useCloseAdminInquiry();
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const close = async (reason: string) => {
    if (busyRef.current) return;

    busyRef.current = true;
    setError(null);

    try {
      await mutateAsync({ inquiryId, reason });
      onClosed();
    } catch (failure) {
      setError(getFailureMessage(failure, CLOSE_FAILURE_TEXT));
    } finally {
      busyRef.current = false;
    }
  };

  return { close, error, isPending, resetError: () => setError(null) };
};

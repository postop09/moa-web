'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import type { AdminInquiry } from '@/entities/admin';
import { adminQueryKeys, useOpenAdminInquiry } from '@/features/adminInquiry';

type Props = {
  inquiryId: string;
  /** 미리보기는 열지 않는다. */
  peek: boolean;
  /** 마운트 뒤 서버에서 새로 받은 결과의 상태. 아직 없으면 undefined. 낡은 캐시 값을 넘기면 안 된다. */
  freshStatus: string | undefined;
  /** 현재 사용자 id 를 확인한다. 확인하지 못하면 null. */
  resolveUserId: () => Promise<string | null>;
  /** 내가 처리 중으로 바꾸고 담당했음이 다시 받은 결과로 확인됐을 때 한 번 부른다. */
  onClaimed: () => void;
};

/**
 * 마운트 뒤 처음 새로 받은 결과에서 "답변 대기" 였던 문의만 한 번 연다(처리 중 + 담당자 지정).
 * 결정은 그때 한 번만 내린다. 운영자가 나중에 직접 "답변 대기" 로 돌려도 다시 열지 않는다.
 * 열기 결과는 mutation 이 문의·메시지를 다시 불러와 반영하고, 실패해도 화면을 막지 않는다.
 * RPC 는 다른 운영자가 먼저 담당했어도 성공하므로, 다시 받은 문의가 "처리 중 + 담당자가 나" 일 때만 알린다.
 */
export const useOpenOnce = ({
  inquiryId,
  peek,
  freshStatus,
  resolveUserId,
  onClaimed,
}: Props) => {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useOpenAdminInquiry();
  const [isFailed, setIsFailed] = useState(false);
  const decidedRef = useRef(false);
  const latestRef = useRef({ resolveUserId, onClaimed });

  useEffect(() => {
    latestRef.current = { resolveUserId, onClaimed };
  });

  useEffect(() => {
    if (freshStatus === undefined || decidedRef.current) return;

    decidedRef.current = true;

    if (peek || freshStatus !== 'waiting') return;

    const confirmClaim = async () => {
      const refetched = queryClient.getQueryData<AdminInquiry>(
        adminQueryKeys.inquiry(inquiryId),
      );
      const me = await latestRef.current.resolveUserId();

      if (
        refetched?.status === 'in_progress' &&
        me !== null &&
        refetched.assigneeId === me
      ) {
        latestRef.current.onClaimed();
      }
    };

    // mutate 의 콜백은 Strict Mode 의 구독 해제·재구독에서 사라질 수 있어 약속(promise)으로 받는다.
    mutateAsync({ inquiryId }).then(confirmClaim, () => setIsFailed(true));
  }, [inquiryId, mutateAsync, peek, freshStatus, queryClient]);

  /** isOpening: 열기와 그 뒤 새로 받기가 끝나기 전. isFailed: 열기 요청이 실패했다. */
  return { isOpening: isPending, isFailed };
};

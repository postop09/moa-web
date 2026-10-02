'use client';

import { useEffect, useRef, useState } from 'react';

import type { AdminInquiry, AdminInquiryMessage } from '@/entities/admin';
import {
  deleteInquiryAttachments,
  isDefinitiveRejection,
  uploadInquiryAttachment,
} from '@/entities/inquiry';
import { useReplyAdminInquiry } from '@/features/adminInquiry';
import { createBrowserClient } from '@/shared/api';

import { createReplyConflictError } from '../lib/createReplyConflictError';
import { getLastMessageId } from '../lib/getLastMessageId';
import { createPhotoUploadError } from '../lib/photoUploadError';

type Props = {
  inquiry: AdminInquiry;
  messages: AdminInquiryMessage[] | undefined;
};

/** 미리보기를 연 시점에 화면이 알고 있던 충돌 검사 기준. */
export type ReplySnapshot = {
  expectedLastMessageId: string | null;
  expectedUpdatedAt: string;
};

type Draft = {
  body: string;
  files: File[];
  snapshot: ReplySnapshot;
};

/**
 * 사진을 문의 작성자 폴더(사용자가 읽을 수 있는 위치)에 올린 뒤 답변을 등록한다.
 * 업로드가 실패하거나 서버가 확정 거절하면 올린 파일을 정리한다(best-effort).
 * 네트워크/알 수 없는 오류는 서버가 처리했을 수 있어 파일을 그대로 둔다.
 * 충돌 검사 기준(마지막 메시지 id, updatedAt)은 미리보기를 연 시점의 값(snapshot)을 그대로 보낸다.
 * 그 뒤 화면이 받은 최신 값이 snapshot 과 달라졌다면, 운영자가 본 적 없는 내용에 답하는 셈이라
 * 업로드도 요청도 하지 않고 충돌로 처리한다.
 */
export const useReplySubmit = ({ inquiry, messages }: Props) => {
  const reply = useReplyAdminInquiry();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const latestRef = useRef({ inquiry, messages });

  useEffect(() => {
    latestRef.current = { inquiry, messages };
  });

  /** 이미 보내는 중이면 false. 아니면 끝날 때까지 기다리고 실패하면 던진다. */
  const submit = async ({ body, files, snapshot }: Draft): Promise<boolean> => {
    if (submittingRef.current) return false;

    const current = latestRef.current;

    if (
      getLastMessageId(current.messages ?? []) !==
        snapshot.expectedLastMessageId ||
      current.inquiry.updatedAt !== snapshot.expectedUpdatedAt
    ) {
      throw createReplyConflictError();
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    const supabase = createBrowserClient();
    const uploaded: string[] = [];
    const cleanup = async () => {
      if (uploaded.length > 0) {
        await deleteInquiryAttachments(supabase, uploaded).catch(() => {});
      }
    };

    try {
      if (files.length > 0) {
        const folderId = crypto.randomUUID();
        const results = await Promise.allSettled(
          files.map((file) =>
            uploadInquiryAttachment(supabase, {
              userId: latestRef.current.inquiry.userId,
              folderId,
              file,
            }),
          ),
        );

        results.forEach((result) => {
          if (result.status === 'fulfilled') uploaded.push(result.value);
        });

        const failed = results.find((result) => result.status === 'rejected');

        if (failed) throw createPhotoUploadError(failed.reason);
      }
    } catch (error) {
      await cleanup();
      submittingRef.current = false;
      setIsSubmitting(false);
      throw error;
    }

    try {
      await reply.mutateAsync({
        inquiryId: latestRef.current.inquiry.id,
        body,
        attachments: uploaded,
        expectedLastMessageId: snapshot.expectedLastMessageId,
        expectedUpdatedAt: snapshot.expectedUpdatedAt,
      });

      return true;
    } catch (error) {
      if (isDefinitiveRejection(error)) await cleanup();
      throw error;
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting };
};

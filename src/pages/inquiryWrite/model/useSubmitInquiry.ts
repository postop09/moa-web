'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getCachedUser } from '@/entities/auth';
import {
  classifyInquiry,
  collectDeviceInfo,
  deleteInquiryAttachments,
  isDefinitiveRejection,
  uploadInquiryAttachment,
  type ClassifyInquiryRes,
} from '@/entities/inquiry';
import {
  useAddInquiryFollowUp,
  useCreateInquiry,
  useUpdateInquiry,
} from '@/features/inquiry';
import { createBrowserClient } from '@/shared/api';

import { AUTH_REQUIRED_MESSAGE } from '../lib/getSubmitFailure';
import type { WriteMode } from '../lib/parseWriteMode';
import { createPhotoUploadError } from '../lib/photoUploadError';

type Input = {
  title: string;
  body: string;
  files: File[];
  includeDeviceInfo: boolean;
};

const CLASSIFY_TIMEOUT_MS = 5000;
const UNCLASSIFIED: ClassifyInquiryRes = { category: null, confidence: null };

/** 최종 분류는 접수를 막지 않는다. 어떤 실패든 미분류로 접수한다. */
const classifyOrNull = async (text: string): Promise<ClassifyInquiryRes> => {
  try {
    return await classifyInquiry(
      text,
      AbortSignal.timeout(CLASSIFY_TIMEOUT_MS),
    );
  } catch {
    return UNCLASSIFIED;
  }
};

/** 성공 시 이동할 경로를 돌려준다. */
export const useSubmitInquiry = (target: WriteMode) => {
  const queryClient = useQueryClient();
  const createInquiry = useCreateInquiry();
  const addFollowUp = useAddInquiryFollowUp();
  const updateInquiry = useUpdateInquiry();

  const requireUser = async (
    supabase: ReturnType<typeof createBrowserClient>,
  ) => {
    const user = await getCachedUser(supabase, queryClient);
    if (!user) throw new Error(AUTH_REQUIRED_MESSAGE);

    return user;
  };

  /**
   * 사진을 같은 폴더에 올리고 경로를 `run` 에 넘긴다.
   * 업로드가 실패하거나 `run` 이 서버의 확정 거절로 끝나면 DB 에 경로가 남지 않으므로
   * 올라간 파일을 정리한다(best-effort). 네트워크/알 수 없는 오류는 서버가 이미
   * 처리했을 수 있어 파일을 그대로 둔다.
   */
  const withUploads = async <T>(
    files: File[],
    run: (paths: string[]) => Promise<T>,
  ): Promise<T> => {
    const supabase = createBrowserClient();
    const uploaded: string[] = [];

    const cleanup = async () => {
      if (uploaded.length > 0) {
        await deleteInquiryAttachments(supabase, uploaded).catch(() => {});
      }
    };

    try {
      if (files.length > 0) {
        const user = await requireUser(supabase);
        const folderId = crypto.randomUUID();
        const results = await Promise.allSettled(
          files.map((file) =>
            uploadInquiryAttachment(supabase, {
              userId: user.id,
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
      throw error;
    }

    try {
      return await run(uploaded);
    } catch (error) {
      if (isDefinitiveRejection(error)) await cleanup();
      throw error;
    }
  };

  return useMutation({
    mutationFn: async (input: Input): Promise<string> => {
      const title = input.title.trim();
      const body = input.body.trim();

      if (target.mode === 'new') {
        // 로그인 상태는 사진이 없어도 먼저 확인한다.
        await requireUser(createBrowserClient());

        const inquiryId = await withUploads(
          input.files,
          async (attachments) => {
            const { category, confidence } = await classifyOrNull(
              `${title}\n${body}`,
            );

            return createInquiry.mutateAsync({
              title,
              body,
              category,
              confidence,
              deviceInfo: input.includeDeviceInfo ? collectDeviceInfo() : null,
              attachments,
            });
          },
        );

        return `/support/inquiries/${inquiryId}/done`;
      }

      if (target.mode === 'followUp') {
        await withUploads(input.files, (attachments) =>
          addFollowUp.mutateAsync({
            inquiryId: target.inquiryId,
            body,
            attachments,
          }),
        );
      } else {
        await updateInquiry.mutateAsync({
          inquiryId: target.inquiryId,
          title,
          body,
        });
      }

      return `/support/inquiries/${target.inquiryId}`;
    },
  });
};

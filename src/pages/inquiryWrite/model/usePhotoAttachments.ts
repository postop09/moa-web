'use client';

import { useState } from 'react';

import {
  INQUIRY_IMAGE_REJECT_MESSAGES,
  INQUIRY_MAX_IMAGES,
} from '@/entities/inquiry';
import { useImageAttachments } from '@/features/inquiry';
import { useToast } from '@/shared/ui';

const getCountAnnouncement = (count: number) =>
  count === 0 ? '사진을 모두 삭제했어요' : `사진 ${count}장 첨부됨`;

/** 문의 작성 화면의 사진 첨부. 거절은 토스트로, 개수 변화는 보조기기 안내로 알린다. */
export const usePhotoAttachments = () => {
  const showToast = useToast((state) => state.showToast);
  const [announcement, setAnnouncement] = useState('');
  const attachments = useImageAttachments({
    max: INQUIRY_MAX_IMAGES,
    onReject: (reason) =>
      showToast(INQUIRY_IMAGE_REJECT_MESSAGES[reason], { tone: 'error' }),
  });

  const addFiles = (files: File[]) => {
    if (files.length === 0) return;

    const result = attachments.addFiles(files);

    if (result.ok) setAnnouncement(getCountAnnouncement(result.count));
  };

  const removePhoto = (id: string) => {
    const count = attachments.removePhoto(id);

    if (count !== null) setAnnouncement(getCountAnnouncement(count));
  };

  return {
    photos: attachments.photos,
    announcement,
    addFiles,
    removePhoto,
    max: attachments.max,
  };
};

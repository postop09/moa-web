'use client';

import {
  INQUIRY_IMAGE_REJECT_MESSAGES,
  INQUIRY_MAX_IMAGES,
} from '@/entities/inquiry';
import { useImageAttachments } from '@/features/inquiry';

const getPhotoCountText = (count: number) =>
  count === 0 ? '사진을 모두 삭제했어요' : `사진 ${count}장 첨부됨`;

type Props = {
  /** 거절 사유 문구. 화면의 인라인 오류 안내로 보낸다. */
  onReject: (message: string) => void;
  /** 첨부가 받아들여지거나 지워졌을 때. 보조기기용 개수 안내 문구를 넘긴다. */
  onChange: (countText: string) => void;
};

/** 답변에 붙일 사진. 거절은 인라인 안내로, 개수 변화는 알림 영역으로 알린다. */
export const useReplyPhotos = ({ onReject, onChange }: Props) => {
  const attachments = useImageAttachments({
    max: INQUIRY_MAX_IMAGES,
    onReject: (reason) => onReject(INQUIRY_IMAGE_REJECT_MESSAGES[reason]),
  });

  /** 사진을 받아들였으면 true. 빈 목록이나 거절은 false. */
  const add = (files: File[]) => {
    if (files.length === 0) return false;

    const result = attachments.addFiles(files);

    if (result.ok) onChange(getPhotoCountText(result.count));

    return result.ok;
  };

  const remove = (id: string) => {
    const count = attachments.removePhoto(id);

    if (count !== null) onChange(getPhotoCountText(count));
  };

  return {
    photos: attachments.photos,
    max: attachments.max,
    add,
    remove,
    clear: attachments.clear,
  };
};

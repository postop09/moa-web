'use client';

import { useEffect, useRef, useState } from 'react';

import { INQUIRY_MAX_IMAGES, validateInquiryImages } from '@/entities/inquiry';
import { useToast } from '@/shared/ui';

export type Photo = { id: string; file: File; url: string };

const REJECT_MESSAGES = {
  count: `사진은 최대 ${INQUIRY_MAX_IMAGES}장까지 올릴 수 있어요.`,
  type: '지원하지 않는 사진 형식이에요. JPG, PNG, WebP, HEIC 사진만 올릴 수 있어요.',
  size: '사진은 장당 10MB까지 올릴 수 있어요.',
} as const;

const getCountAnnouncement = (count: number) =>
  count === 0 ? '사진을 모두 삭제했어요' : `사진 ${count}장 첨부됨`;

export const usePhotoAttachments = () => {
  const showToast = useToast((state) => state.showToast);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const urlsRef = useRef(new Set<string>());

  useEffect(() => {
    const urls = urlsRef.current;

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  /** 하나라도 규칙에 어긋나면 하나도 추가하지 않는다. */
  const addFiles = (files: File[]) => {
    if (files.length === 0) return;

    const result = validateInquiryImages(
      photos.length,
      files.map(({ size, type, name }) => ({ size, type, name })),
    );
    if (!result.ok) {
      showToast(REJECT_MESSAGES[result.reason], { tone: 'error' });
      return;
    }

    const added = files.map((file) => {
      const url = URL.createObjectURL(file);
      urlsRef.current.add(url);

      return { id: crypto.randomUUID(), file, url };
    });
    setPhotos((prev) => [...prev, ...added]);
    setAnnouncement(getCountAnnouncement(photos.length + added.length));
  };

  const removePhoto = (id: string) => {
    const target = photos.find((photo) => photo.id === id);
    if (!target) return;

    URL.revokeObjectURL(target.url);
    urlsRef.current.delete(target.url);
    setPhotos((prev) => prev.filter((photo) => photo.id !== id));
    setAnnouncement(getCountAnnouncement(photos.length - 1));
  };

  return {
    photos,
    announcement,
    addFiles,
    removePhoto,
    max: INQUIRY_MAX_IMAGES,
  };
};

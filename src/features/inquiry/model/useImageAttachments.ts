'use client';

import { useEffect, useRef, useState } from 'react';

import { validateInquiryImages } from '@/entities/inquiry';

export type ImageAttachment = { id: string; file: File; url: string };

export type ImageRejectReason = 'count' | 'type' | 'size';

export type AddImagesResult =
  { ok: true; count: number } | { ok: false; reason: ImageRejectReason };

type Props = {
  max: number;
  /** 규칙에 어긋나 하나도 추가하지 못했을 때, 거절 한 번에 한 번 부른다. */
  onReject: (reason: ImageRejectReason) => void;
};

/** 첨부할 사진 초안. 미리보기 object URL 의 생성과 해제를 맡는다. */
export const useImageAttachments = ({ max, onReject }: Props) => {
  const [photos, setPhotos] = useState<ImageAttachment[]>([]);
  const urlsRef = useRef(new Set<string>());
  const onRejectRef = useRef(onReject);

  useEffect(() => {
    onRejectRef.current = onReject;
  });

  useEffect(() => {
    const urls = urlsRef.current;

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const revoke = (url: string) => {
    URL.revokeObjectURL(url);
    urlsRef.current.delete(url);
  };

  /** 하나라도 규칙에 어긋나면 하나도 추가하지 않는다. */
  const addFiles = (files: File[]): AddImagesResult => {
    if (files.length === 0) return { ok: true, count: photos.length };

    const result = validateInquiryImages(
      photos.length,
      files.map(({ size, type, name }) => ({ size, type, name })),
    );

    if (!result.ok) {
      onRejectRef.current(result.reason);

      return result;
    }

    const added = files.map((file) => {
      const url = URL.createObjectURL(file);

      urlsRef.current.add(url);

      return { id: crypto.randomUUID(), file, url };
    });

    setPhotos((prev) => [...prev, ...added]);

    return { ok: true, count: photos.length + added.length };
  };

  /** 남은 사진 수를 돌려준다. 없는 id 면 null. */
  const removePhoto = (id: string) => {
    const target = photos.find((photo) => photo.id === id);

    if (!target) return null;

    revoke(target.url);
    setPhotos((prev) => prev.filter((photo) => photo.id !== id));

    return photos.length - 1;
  };

  const clear = () => {
    photos.forEach((photo) => revoke(photo.url));
    setPhotos([]);
  };

  return { photos, addFiles, removePhoto, clear, max };
};

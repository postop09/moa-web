'use client';

import { useRef, useState } from 'react';

import { useAttachmentUrls } from '@/features/inquiry';
import { useRestoreFocus } from '@/shared/lib';

import { PHOTO_FAILED_TEXT } from '../config/texts';

import styles from './attachmentGallery.module.css';
import { PhotoViewer } from './PhotoViewer';

type Props = {
  paths: string[];
  /** 사진 버튼 이름에서 작성자별 사진을 구분한다. 예) '내 문의', '운영자 답변' */
  ownerLabel: string;
};

type ThumbnailProps = {
  url: string;
  label: string;
  onOpen: () => void;
  buttonRef: (element: HTMLButtonElement | null) => void;
};

// 부모가 key={url} 로 감싸 URL 이 바뀌면(재서명) 실패 표시도 함께 초기화된다.
const Thumbnail = ({ url, label, onOpen, buttonRef }: ThumbnailProps) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className={styles.thumbMissing}>{PHOTO_FAILED_TEXT}</span>;
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className={styles.thumbButton}
      aria-label={label}
      aria-haspopup="dialog"
      onClick={onOpen}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 서명 URL 이라 최적화 대상이 아니다 */}
      <img
        src={url}
        alt=""
        className={styles.thumbImage}
        onError={() => setFailed(true)}
      />
    </button>
  );
};

export const AttachmentGallery = ({ paths, ownerLabel }: Props) => {
  const { data, isError } = useAttachmentUrls(paths);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const openedFromRef = useRef(0);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useRestoreFocus(
    viewerIndex !== null,
    () => thumbRefs.current[openedFromRef.current],
  );

  const urls = paths.map((_, index) => data?.[index]?.url ?? null);
  const isLoading = data === undefined && !isError;

  const openViewer = (index: number) => {
    openedFromRef.current = index;
    setViewerIndex(index);
  };

  return (
    <>
      <ul className={styles.thumbs}>
        {paths.map((path, index) => {
          const url = urls[index];

          return (
            <li key={path} className={styles.thumbItem}>
              {isLoading ? (
                <span className={styles.thumbSkeleton} aria-hidden />
              ) : url ? (
                <Thumbnail
                  key={url}
                  url={url}
                  label={`${ownerLabel} 첨부 사진 ${index + 1} 크게 보기`}
                  onOpen={() => openViewer(index)}
                  buttonRef={(element) => {
                    thumbRefs.current[index] = element;
                  }}
                />
              ) : (
                <span className={styles.thumbMissing}>{PHOTO_FAILED_TEXT}</span>
              )}
            </li>
          );
        })}
      </ul>
      {viewerIndex !== null ? (
        <PhotoViewer
          urls={urls}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      ) : null}
    </>
  );
};

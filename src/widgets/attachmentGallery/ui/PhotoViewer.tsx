'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Modal } from '@/shared/ui';

import { PHOTO_FAILED_TEXT } from '../config/texts';

import styles from './attachmentGallery.module.css';

type Props = {
  /** 서명에 실패한 사진은 null. 순서는 첨부 순서와 같다. */
  urls: (string | null)[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

/** from 에서 dir 방향으로 가장 가까운, 불러온 사진의 인덱스. 없으면 null. */
const findLoaded = (urls: (string | null)[], from: number, dir: 1 | -1) => {
  for (let i = from + dir; i >= 0 && i < urls.length; i += dir) {
    if (urls[i]) return i;
  }

  return null;
};

type ViewerImageProps = {
  url: string | null;
  alt: string;
};

// 부모가 key 로 사진마다 새로 마운트해 실패 표시가 다음 사진으로 번지지 않게 한다.
const ViewerImage = ({ url, alt }: ViewerImageProps) => {
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return <p className={styles.viewerMissing}>{PHOTO_FAILED_TEXT}</p>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- 서명 URL 이라 최적화 대상이 아니다
    <img
      src={url}
      alt={alt}
      className={styles.viewerImage}
      onError={() => setFailed(true)}
    />
  );
};

export const PhotoViewer = ({ urls, index, onIndexChange, onClose }: Props) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const prevIndex = findLoaded(urls, index, -1);
  const nextIndex = findLoaded(urls, index, 1);
  const loadedCount = urls.filter(Boolean).length;
  const hasMultiple = loadedCount > 1;
  // 불러오지 못한 사진은 건너뛰므로 위치 안내는 불러온 사진 기준이다.
  const loadedPosition = urls.slice(0, index + 1).filter(Boolean).length;

  const goTo = (target: number | null) => {
    if (target !== null) onIndexChange(target);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') goTo(prevIndex);
      if (event.key === 'ArrowRight') goTo(nextIndex);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <Modal
      title={`첨부 사진 ${index + 1} / ${urls.length}`}
      onClose={onClose}
      variant="viewer"
      initialFocus={closeRef}
    >
      <div className={styles.viewerBody}>
        <ViewerImage
          key={urls[index] ?? `missing-${index}`}
          url={urls[index]}
          alt={`${index + 1}번째 첨부 사진 확대 이미지`}
        />
        <p className="srOnly" role="status">
          {`${loadedPosition} / ${loadedCount}`}
        </p>
        <div className={styles.viewerControls}>
          {hasMultiple ? (
            <button
              type="button"
              className={styles.viewerButton}
              aria-label="이전 사진"
              aria-disabled={prevIndex === null}
              onClick={() => goTo(prevIndex)}
            >
              <ChevronLeft size={24} aria-hidden />
            </button>
          ) : null}
          <button
            ref={closeRef}
            type="button"
            className={styles.viewerButton}
            aria-label="닫기"
            onClick={onClose}
          >
            <X size={24} aria-hidden />
          </button>
          {hasMultiple ? (
            <button
              type="button"
              className={styles.viewerButton}
              aria-label="다음 사진"
              aria-disabled={nextIndex === null}
              onClick={() => goTo(nextIndex)}
            >
              <ChevronRight size={24} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
};

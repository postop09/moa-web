'use client';

import { Camera, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';

import { INQUIRY_IMAGE_TYPES } from '@/entities/inquiry';
import type { ImageAttachment } from '@/features/inquiry';

import styles from './composer.module.css';

const ACCEPT = INQUIRY_IMAGE_TYPES.join(',');
const ADD_BUTTON = 'add';

type Props = {
  photos: ImageAttachment[];
  max: number;
  /** 등록 중에는 바꿀 수 없다. 포커스를 잃지 않도록 disabled 가 아닌 aria-disabled 로 막는다. */
  isLocked: boolean;
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
};

/** 일부 브라우저는 HEIC 를 그릴 수 없다. 로드 실패 시 안내 문구로 대체한다. */
const ThumbPreview = ({ url }: { url: string }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={styles.thumbFallback}>미리보기를 표시할 수 없어요</span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- blob 미리보기라 최적화 대상이 아니다
    <img
      src={url}
      alt=""
      className={styles.thumbImage}
      onError={() => setFailed(true)}
    />
  );
};

export const PhotoPicker = ({
  photos,
  max,
  isLocked,
  onAdd,
  onRemove,
}: Props) => {
  const fullHintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const removeButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<string | null>(null);
  const isFull = photos.length >= max;

  // 삭제로 포커스를 잃은 자리에 가까운 컨트롤로 포커스를 옮긴다.
  useEffect(() => {
    const target = pendingFocus.current;

    if (target === null) return;

    pendingFocus.current = null;

    if (target === ADD_BUTTON) addButtonRef.current?.focus();
    else removeButtonRefs.current.get(target)?.focus();
  }, [photos]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;

    // 같은 파일을 다시 고를 수 있게 값을 비우기 전에 목록을 복사한다.
    onAdd(Array.from(input.files ?? []));
    input.value = '';
  };

  const handleRemove = (id: string) => {
    if (isLocked) return;

    const index = photos.findIndex((photo) => photo.id === id);
    const neighbor = photos[index + 1] ?? photos[index - 1];

    pendingFocus.current = neighbor ? neighbor.id : ADD_BUTTON;
    onRemove(id);
  };

  return (
    <div className={styles.photos}>
      <button
        ref={addButtonRef}
        type="button"
        className={styles.photoAdd}
        aria-disabled={isLocked || isFull}
        aria-describedby={isFull ? fullHintId : undefined}
        onClick={() => {
          if (!isLocked && !isFull) inputRef.current?.click();
        }}
      >
        <span className="srOnly">{`첨부 사진 ${photos.length} / ${max}장`}</span>
        <Camera size={18} aria-hidden />
        사진 추가
      </button>
      <span className={styles.photoCount}>{`${photos.length} / ${max}`}</span>
      <ul className={styles.thumbs}>
        {photos.map((photo) => (
          <li key={photo.id} className={styles.thumb}>
            <span className={styles.thumbFrame}>
              <ThumbPreview url={photo.url} />
              <span className={styles.thumbName}>{photo.file.name}</span>
            </span>
            <button
              ref={(element) => {
                if (element) removeButtonRefs.current.set(photo.id, element);
                else removeButtonRefs.current.delete(photo.id);
              }}
              type="button"
              className={styles.thumbRemove}
              aria-label={`${photo.file.name} 사진 삭제`}
              aria-disabled={isLocked}
              onClick={() => handleRemove(photo.id)}
            >
              <X size={16} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      {isFull ? (
        <p id={fullHintId} className={styles.photoFullHint}>
          {`사진은 최대 ${max}장까지 올릴 수 있어요`}
        </p>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        tabIndex={-1}
        onChange={handleChange}
      />
    </div>
  );
};

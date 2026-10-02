'use client';

import { Camera, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';

import { INQUIRY_IMAGE_TYPES } from '@/entities/inquiry';
import type { ImageAttachment } from '@/features/inquiry';

import styles from './inquiryWrite.module.css';

const ACCEPT = INQUIRY_IMAGE_TYPES.join(',');

type Props = {
  photos: ImageAttachment[];
  max: number;
  /** 첨부/삭제 결과를 스크린 리더에 알리는 문구 */
  announcement: string;
  disabled: boolean;
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
};

const ADD_BUTTON = 'add';

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
  announcement,
  disabled,
  onAdd,
  onRemove,
}: Props) => {
  const titleId = useId();
  const hintId = useId();
  const countId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const removeButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<string | null>(null);

  // 삭제로 포커스를 잃은 자리에 가까운 컨트롤로 포커스를 옮긴다.
  useEffect(() => {
    const target = pendingFocus.current;
    if (target === null) return;

    pendingFocus.current = null;
    if (target === ADD_BUTTON) {
      addButtonRef.current?.focus();
    } else {
      removeButtonRefs.current.get(target)?.focus();
    }
  }, [photos]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    // 같은 파일을 다시 고를 수 있게 값을 비우기 전에 목록을 복사한다.
    onAdd(Array.from(input.files ?? []));
    input.value = '';
  };

  const handleRemove = (id: string) => {
    const index = photos.findIndex((photo) => photo.id === id);
    const neighbor = photos[index + 1] ?? photos[index - 1];
    pendingFocus.current = neighbor ? neighbor.id : ADD_BUTTON;
    onRemove(id);
  };

  return (
    <section className={styles.photos} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.label}>
        사진 첨부 (선택, 최대 3장)
      </h2>
      <div className={styles.photoRow}>
        <div className={styles.photoAddCell}>
          <button
            ref={addButtonRef}
            type="button"
            className={styles.photoAdd}
            disabled={disabled || photos.length >= max}
            aria-describedby={`${countId} ${hintId}`}
            onClick={() => inputRef.current?.click()}
          >
            <Camera size={24} aria-hidden />
            사진 추가
          </button>
          <span id={countId} className={styles.photoCount}>
            {`${photos.length} / ${max}`}
          </span>
        </div>
        <ul className={styles.thumbs}>
          {photos.map((photo) => {
            const captionId = `${photo.id}-name`;

            return (
              <li key={photo.id} className={styles.thumb}>
                <ThumbPreview url={photo.url} />
                <span id={captionId} className={styles.thumbName}>
                  {photo.file.name}
                </span>
                <button
                  ref={(element) => {
                    if (element) {
                      removeButtonRefs.current.set(photo.id, element);
                    } else {
                      removeButtonRefs.current.delete(photo.id);
                    }
                  }}
                  type="button"
                  className={styles.thumbRemove}
                  aria-label={`${photo.file.name} 사진 삭제`}
                  disabled={disabled}
                  onClick={() => handleRemove(photo.id)}
                >
                  <X size={16} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <p id={hintId} className={styles.hint}>
        카드번호·계좌번호는 가리고 올려주세요
      </p>
      <p role="status" className="srOnly">
        {announcement}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        tabIndex={-1}
        onChange={handleChange}
      />
    </section>
  );
};

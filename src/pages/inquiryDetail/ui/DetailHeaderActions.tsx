import Link from 'next/link';
import type { Ref } from 'react';

import { NEW_INQUIRY_PATH } from '../config/texts';

import styles from './inquiryDetail.module.css';

type Props = {
  inquiryId: string;
  canEdit: boolean;
  deleteRef: Ref<HTMLButtonElement>;
  onDelete: () => void;
};

export const DetailHeaderActions = ({
  inquiryId,
  canEdit,
  deleteRef,
  onDelete,
}: Props) => (
  <>
    {/* 수정할 수 없어도 자리는 비워 두어 '삭제' 가 밀리지 않게 한다. */}
    <span data-slot="edit-action" className={styles.editSlot}>
      {canEdit ? (
        <Link
          href={`${NEW_INQUIRY_PATH}?edit=${inquiryId}`}
          className={styles.headerAction}
          aria-label="문의 수정"
        >
          수정
        </Link>
      ) : null}
    </span>
    <button
      ref={deleteRef}
      type="button"
      className={styles.headerAction}
      aria-label="문의 삭제"
      onClick={onDelete}
    >
      삭제
    </button>
  </>
);

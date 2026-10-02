import { ConfirmDialog } from '@/shared/ui';

import styles from './composer.module.css';

type Props = {
  body: string;
  photoCount: number;
  onCancel: () => void;
  onConfirm: () => void;
};

/** 등록 전 확인. 사용자에게 보이는 그대로(본문, 첨부 장수)를 다시 보여 준다. */
export const ReplyPreviewDialog = ({
  body,
  photoCount,
  onCancel,
  onConfirm,
}: Props) => (
  <ConfirmDialog
    title="답변을 등록할까요?"
    message={
      <>
        <span className={styles.previewBody}>{body}</span>
        {photoCount > 0 ? (
          <span className={styles.previewMeta}>{`첨부 ${photoCount}장`}</span>
        ) : null}
      </>
    }
    confirmLabel="등록"
    cancelLabel="계속 수정"
    tone="default"
    onCancel={onCancel}
    onConfirm={onConfirm}
  />
);

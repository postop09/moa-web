import { ConfirmDialog } from '@/shared/ui';

import { DELETE_FAILURE_TEXT } from '../config/texts';

type Props = {
  /** 답변이 있거나, 메시지를 아직 몰라 있을 수 있는 경우. */
  mayHaveReply: boolean;
  isPending: boolean;
  isFailed: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

// ConfirmDialog 는 Error.message 를 그대로 보여준다. 서버 오류 문구가 새지 않도록 고정 문구만 담은 Error 를 넘긴다.
const DELETE_FAILURE = new Error(DELETE_FAILURE_TEXT);

export const DeleteInquiryDialog = ({
  mayHaveReply,
  isPending,
  isFailed,
  onCancel,
  onConfirm,
}: Props) => (
  <ConfirmDialog
    title="문의 삭제"
    message={
      mayHaveReply
        ? '삭제하면 답변도 함께 사라지고 되돌릴 수 없어요.'
        : '문의를 삭제할까요? 삭제하면 되돌릴 수 없어요.'
    }
    confirmLabel="삭제"
    confirmEmphasis="subtle"
    isPending={isPending}
    error={isFailed ? DELETE_FAILURE : null}
    fallbackError={DELETE_FAILURE_TEXT}
    onCancel={onCancel}
    onConfirm={onConfirm}
  />
);

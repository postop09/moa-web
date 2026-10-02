import { ConfirmDialog } from '@/shared/ui';

import { CLOSE_FAILURE_TEXT } from '../config/texts';

type Props = {
  isPending: boolean;
  isFailed: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

// ConfirmDialog 는 Error.message 를 그대로 보여준다. 서버 오류 문구가 새지 않도록 고정 문구만 담은 Error 를 넘긴다.
const CLOSE_FAILURE = new Error(CLOSE_FAILURE_TEXT);

export const CloseInquiryDialog = ({
  isPending,
  isFailed,
  onCancel,
  onConfirm,
}: Props) => (
  <ConfirmDialog
    title="문의를 종결할까요?"
    message="종결하면 추가 문의를 이어갈 수 없어요."
    confirmLabel="종결하기"
    tone="default"
    isPending={isPending}
    error={isFailed ? CLOSE_FAILURE : null}
    fallbackError={CLOSE_FAILURE_TEXT}
    onCancel={onCancel}
    onConfirm={onConfirm}
  />
);

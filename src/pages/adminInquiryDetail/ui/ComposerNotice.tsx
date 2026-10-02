import { Button } from '@/shared/ui';

import styles from './composer.module.css';

export type Notice = {
  message: string;
  /** 다른 운영자가 먼저 답변했다. 새로고침 버튼을 함께 보인다. */
  isConflict: boolean;
};

type Props = {
  notice: Notice;
  onRefresh?: () => void;
};

/** 작성 영역의 단일 인라인 오류 안내. 버튼들 위에 둔다. */
export const ComposerNotice = ({ notice, onRefresh }: Props) => (
  <div className={styles.notice}>
    <p className={styles.noticeText} role="alert">
      {notice.message}
    </p>
    {notice.isConflict && onRefresh ? (
      <Button variant="secondary" size="sm" onClick={onRefresh}>
        새로고침
      </Button>
    ) : null}
  </div>
);

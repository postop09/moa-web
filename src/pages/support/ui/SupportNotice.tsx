import { ShieldCheck } from 'lucide-react';

import styles from './support.module.css';

export const SupportNotice = () => {
  return (
    <p className={styles.notice}>
      <ShieldCheck size={20} strokeWidth={2} aria-hidden />
      <span>운영자는 비밀번호·인증번호를 묻지 않아요</span>
    </p>
  );
};

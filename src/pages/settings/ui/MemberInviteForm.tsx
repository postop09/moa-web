'use client';

import { useState, type FormEvent } from 'react';

import { useCreateHouseholdInvite } from '@/features/householdMember';
import { Modal } from '@/shared/ui';

import styles from '../settings.module.css';

type Props = {
  householdId: string;
  currentUserEmail: string;
  memberEmails: string[];
  onClose: () => void;
};

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const MemberInviteForm = ({
  householdId,
  currentUserEmail,
  memberEmails,
  onClose,
}: Props) => {
  const { mutateAsync, isPending, error } =
    useCreateHouseholdInvite(householdId);
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      return;
    }

    if (!isValidEmail(trimmed)) {
      setValidationError('올바른 이메일을 입력해 주세요.');
      return;
    }

    if (trimmed === currentUserEmail.trim().toLowerCase()) {
      setValidationError('자기 자신은 초대할 수 없습니다.');
      return;
    }

    if (memberEmails.some((item) => item.trim().toLowerCase() === trimmed)) {
      setValidationError('이미 가계부에 있는 멤버입니다.');
      return;
    }

    setValidationError(null);

    try {
      const invite = await mutateAsync(trimmed);
      setInviteUrl(`${window.location.origin}/invite/${invite.token}`);
    } catch {
      // mutation error state에 표시
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const mailtoHref = inviteUrl
    ? `mailto:${email.trim()}?subject=${encodeURIComponent('Moa 가계부 초대')}&body=${encodeURIComponent(`가계부에 초대합니다.\n${inviteUrl}`)}`
    : '';

  if (inviteUrl) {
    return (
      <Modal title="초대 링크" onClose={onClose}>
        <div className={styles.modalBody}>
          <p className={styles.confirmText}>
            아래 링크를 초대할 사람에게 전달해 주세요. Google로 로그인한
            이메일이 초대 주소와 같아야 합니다.
          </p>
          <p className={styles.linkBox}>{inviteUrl}</p>
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                window.location.href = mailtoHref;
              }}
            >
              메일 앱으로 보내기
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleCopy}
            >
              {copied ? '복사됨' : '링크 복사'}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="멤버 초대" onClose={onClose} closeDisabled={isPending}>
      <form className={styles.modalBody} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="inviteEmail">
            이메일
          </label>
          <input
            id="inviteEmail"
            className={styles.input}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isPending}
          />
        </div>
        {validationError || error ? (
          <p className={styles.error}>
            {validationError ??
              (error instanceof Error ? error.message : '초대에 실패했습니다.')}
          </p>
        ) : null}
        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onClose}
            disabled={isPending}
          >
            취소
          </button>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={isPending}
          >
            {isPending ? '초대 중…' : '초대 링크 만들기'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

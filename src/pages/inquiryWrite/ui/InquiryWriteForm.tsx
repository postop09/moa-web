'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';

import {
  INQUIRY_BODY_MAX,
  INQUIRY_BODY_MIN,
  INQUIRY_TITLE_MAX,
  validateInquiryForm,
} from '@/entities/inquiry';
import { useBeforeUnloadGuard, useSafeBack } from '@/shared/lib';
import { Button, ConfirmDialog, PageHeader, useToast } from '@/shared/ui';

import { EDIT_LOCKED_MESSAGE, getSubmitFailure } from '../lib/getSubmitFailure';
import type { WriteMode } from '../lib/parseWriteMode';
import { useClassifySuggestion } from '../model/useClassifySuggestion';
import { usePhotoAttachments } from '../model/usePhotoAttachments';
import { useSubmitInquiry } from '../model/useSubmitInquiry';

import { DeviceInfoConsent } from './DeviceInfoConsent';
import styles from './inquiryWrite.module.css';
import { OriginalInquirySummary } from './OriginalInquirySummary';
import { PhotoPicker } from './PhotoPicker';
import { SuggestedFaqs } from './SuggestedFaqs';
import { TextField } from './TextField';

const PRIVACY_NOTICE =
  '입력한 내용은 문의 분류를 위해 외부 AI 서비스로 전송돼요.';
/** 하단 고정 등록 바 높이만큼 토스트를 띄운다. */
const TOAST_OFFSET_ABOVE_BAR = '6rem';

const HEADER_TITLES: Record<WriteMode['mode'], string> = {
  new: '1:1 문의하기',
  followUp: '추가 문의',
  edit: '문의 수정',
};

const countChars = (value: string) => [...value].length;

type Props = {
  target: WriteMode;
  initialTitle?: string;
  initialBody?: string;
};

export const InquiryWriteForm = ({
  target,
  initialTitle = '',
  initialBody = '',
}: Props) => {
  const { mode } = target;
  const router = useRouter();
  const showToast = useToast((state) => state.showToast);
  const noticeId = useId();
  const submitRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // 같은 tick 에 submit 이 두 번 들어와도 state 갱신 전에 막는다.
  const submittingRef = useRef(false);

  const detailPath =
    target.mode === 'new'
      ? '/support'
      : `/support/inquiries/${target.inquiryId}`;
  const goBack = useSafeBack(detailPath);

  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [touched, setTouched] = useState({ title: false, body: false });
  const [hasReachedBodyMin, setHasReachedBodyMin] = useState(false);
  const [includeDeviceInfo, setIncludeDeviceInfo] = useState(true);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const photos = usePhotoAttachments();
  const { category, isActive: isClassifying } = useClassifySuggestion(
    body,
    mode === 'new',
  );
  const submit = useSubmitInquiry(target);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--toast-bottom-offset', TOAST_OFFSET_ABOVE_BAR);

    return () => {
      root.style.removeProperty('--toast-bottom-offset');
    };
  }, []);

  const { valid, errors } = validateInquiryForm({
    title,
    body,
    mode: mode === 'followUp' ? 'followUp' : 'new',
  });
  const titleError = touched.title ? errors.title : undefined;
  // 첫 입력 중에는 조용히 두고, blur 하거나 10자에 한 번 도달한 뒤부터 알린다.
  const bodyError = touched.body || hasReachedBodyMin ? errors.body : undefined;

  const isDirty =
    title.trim() !== initialTitle.trim() ||
    body.trim() !== initialBody.trim() ||
    photos.photos.length > 0;
  const isBusy = submit.isPending || isDone;

  useBeforeUnloadGuard(isDirty && !isBusy);

  const failure = submit.isError ? getSubmitFailure(submit.error) : null;
  const inlineError =
    failure && failure.kind !== 'locked' ? failure.message : null;

  // 실패하면 등록 버튼이 다시 열리므로 포커스를 거기로 돌려 재시도하게 한다.
  const submitStatus = submit.status;
  useEffect(() => {
    if (submitStatus === 'error') submitRef.current?.focus();
  }, [submitStatus]);

  const handleBodyChange = (value: string) => {
    setBody(value);
    if (countChars(value.trim()) >= INQUIRY_BODY_MIN) {
      setHasReachedBodyMin(true);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy || submittingRef.current) return;
    if (!valid) {
      // 막힌 버튼을 눌렀다: 모든 필드 오류를 보여주고 첫 오류 필드로 포커스를 옮긴다.
      setTouched({ title: true, body: true });
      const firstInvalid = errors.title ? 'title' : 'body';
      const field = formRef.current?.elements.namedItem(firstInvalid);
      if (field instanceof HTMLElement) field.focus();
      return;
    }

    submittingRef.current = true;
    submit.mutate(
      {
        title,
        body,
        files: photos.photos.map((photo) => photo.file),
        includeDeviceInfo,
      },
      {
        onSuccess: (path) => {
          // 이동이 끝날 때까지 버튼을 다시 열지 않는다(중복 접수 방지).
          setIsDone(true);
          if (mode === 'followUp') showToast('추가 문의를 보냈어요.');
          router.replace(path);
        },
        onError: (error) => {
          const { kind } = getSubmitFailure(error);

          if (kind === 'locked') {
            // 수정 불가 상태가 됐다. 폼을 더 쓰지 못하게 닫고 상세로 보낸다.
            setIsDone(true);
            showToast(EDIT_LOCKED_MESSAGE);
            router.replace(detailPath);
            return;
          }

          // 실패 안내는 제출 바 위 인라인 알림 한 곳에서만 한다.
          submittingRef.current = false;
        },
      },
    );
  };

  const handleBack = () => {
    if (isDirty) {
      setIsLeaveOpen(true);
      return;
    }
    goBack();
  };

  return (
    <main className={styles.page}>
      <PageHeader
        title={HEADER_TITLES[mode]}
        onBack={handleBack}
        backDisabled={isBusy}
      />

      <form
        ref={formRef}
        className={styles.form}
        onSubmit={handleSubmit}
        noValidate
      >
        <div className={styles.content}>
          {mode !== 'followUp' ? (
            <TextField
              name="title"
              label="제목"
              value={title}
              onChange={setTitle}
              onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
              error={titleError}
              readOnly={isBusy}
              maxLength={INQUIRY_TITLE_MAX}
              counter={`${countChars(title)} / ${INQUIRY_TITLE_MAX}`}
            />
          ) : target.mode === 'followUp' ? (
            <OriginalInquirySummary inquiryId={target.inquiryId} />
          ) : null}
          <TextField
            multiline
            name="body"
            label="내용"
            value={body}
            onChange={handleBodyChange}
            onBlur={() => setTouched((prev) => ({ ...prev, body: true }))}
            error={bodyError}
            readOnly={isBusy}
            isOverLimit={countChars(body.trim()) > INQUIRY_BODY_MAX}
            describedBy={mode === 'new' ? noticeId : undefined}
            counter={`${countChars(body).toLocaleString('ko-KR')} / ${INQUIRY_BODY_MAX.toLocaleString('ko-KR')} (최소 ${INQUIRY_BODY_MIN}자)`}
          />
          {mode === 'new' ? (
            <p id={noticeId} className={styles.hint}>
              {PRIVACY_NOTICE}
            </p>
          ) : null}
          {mode === 'edit' ? (
            <p className={styles.hint}>첨부는 수정할 수 없어요.</p>
          ) : null}

          {mode === 'new' ? (
            <SuggestedFaqs category={category} reserveSpace={isClassifying} />
          ) : null}
          {mode !== 'edit' ? (
            <PhotoPicker
              photos={photos.photos}
              max={photos.max}
              announcement={photos.announcement}
              disabled={isBusy}
              onAdd={photos.addFiles}
              onRemove={photos.removePhoto}
            />
          ) : null}
          {mode === 'new' ? (
            <DeviceInfoConsent
              checked={includeDeviceInfo}
              disabled={isBusy}
              onChange={setIncludeDeviceInfo}
            />
          ) : null}
        </div>

        <div className={styles.submitBar}>
          {inlineError ? (
            <p role="alert" className={styles.submitError}>
              {inlineError}
            </p>
          ) : null}
          <Button
            ref={submitRef}
            type="submit"
            fullWidth
            className={styles.submitButton}
            aria-disabled={!valid || undefined}
            loading={isBusy}
            loadingLabel="등록하는 중…"
          >
            문의 등록
          </Button>
        </div>
      </form>

      {isLeaveOpen ? (
        <ConfirmDialog
          title="작성 중인 내용이 사라져요"
          message="지금 나가면 입력한 내용이 저장되지 않아요."
          confirmLabel="나가기"
          cancelLabel="계속 쓰기"
          tone="default"
          confirmEmphasis="subtle"
          onCancel={() => setIsLeaveOpen(false)}
          onConfirm={() => goBack()}
        />
      ) : null}
    </main>
  );
};

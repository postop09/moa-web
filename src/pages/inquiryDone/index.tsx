'use client';

import { Bell, Check, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { getInquiryCategoryLabel } from '@/entities/inquiry';
import { useInquiry } from '@/features/inquiry';
import { useSafeBack } from '@/shared/lib';
import { Button, useToast } from '@/shared/ui';

import { DoneSkeleton } from './ui/DoneSkeleton';
import styles from './ui/inquiryDone.module.css';

type Props = {
  inquiryId: string;
};

export const InquiryDonePage = ({ inquiryId }: Props) => {
  const router = useRouter();
  const showToast = useToast((state) => state.showToast);
  // 작성 화면은 replace 로 히스토리에서 빠졌다. 앱 내 이전 화면이 없으면 고객센터로 보낸다.
  const goBack = useSafeBack('/support');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { data: inquiry, isLoading } = useInquiry(inquiryId, { retry: 1 });

  const isMissing = !isLoading && inquiry === null;
  // 조회 실패(error)여도 접수는 끝났으므로 분류 칩만 빼고 완료 화면을 보여준다.
  const category = inquiry?.category ?? null;

  useEffect(() => {
    if (isMissing) {
      showToast('문의가 접수되지 않았거나 삭제됐어요.');
      router.replace('/support/inquiries');
    }
  }, [isMissing, router, showToast]);

  // 화면이 바뀐 것을 알리도록 제목이 나타나면 포커스를 옮긴다. 조회 재시도가 끝나길
  // 기다리면 그동안 포커스가 body 에 남으므로 로딩 중이어도 바로 옮긴다.
  useEffect(() => {
    if (!isMissing) headingRef.current?.focus();
  }, [isMissing]);

  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <button type="button" className={styles.close} onClick={goBack}>
          닫기
        </button>
      </div>

      {isMissing ? null : (
        <div className={styles.body}>
          <span className={styles.check} aria-hidden>
            <Check size={44} strokeWidth={3} />
          </span>
          <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
            문의가 접수됐어요
          </h1>
          {isLoading ? <DoneSkeleton /> : null}
          {category ? (
            <p className={styles.chip}>
              {`${getInquiryCategoryLabel(category)} 문의로 접수됐어요`}
            </p>
          ) : null}
          <ul className={styles.notice}>
            <li>
              <Bell size={20} aria-hidden />
              답변이 등록되면 내 문의에서 확인할 수 있어요
            </li>
            <li>
              <Clock size={20} aria-hidden />
              평일 기준 1일 이내 답변해요
            </li>
          </ul>
        </div>
      )}

      <div className={styles.actions}>
        <Button
          variant="secondary"
          fullWidth
          className={styles.action}
          onClick={() => router.replace('/support/inquiries')}
        >
          내 문의 보기
        </Button>
        <Button fullWidth className={styles.action} onClick={goBack}>
          확인
        </Button>
      </div>
    </main>
  );
};

export default InquiryDonePage;

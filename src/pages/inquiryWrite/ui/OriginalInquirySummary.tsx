'use client';

import { useInquiry } from '@/features/inquiry';

import styles from './inquiryWrite.module.css';

type Props = {
  inquiryId: string;
};

/** 추가 문의가 어떤 문의에 대한 것인지 보여준다. 조회 전·실패 시에는 그리지 않는다. */
export const OriginalInquirySummary = ({ inquiryId }: Props) => {
  const { data: inquiry } = useInquiry(inquiryId);

  if (!inquiry) return null;

  return <p className={styles.origin}>{`원 문의: ${inquiry.title}`}</p>;
};

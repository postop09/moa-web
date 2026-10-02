import { useId, type Ref } from 'react';

import type { AdminInquiryMessage } from '@/entities/admin';
import { formatInquiryDetailDate } from '@/entities/inquiry';
import { AttachmentGallery } from '@/widgets/attachmentGallery';

import { QUESTION_PHOTO_OWNER, REPLY_PHOTO_OWNER } from '../config/texts';
import { getEmailName } from '../lib/getEmailName';

import styles from './adminInquiryDetail.module.css';

type Props = {
  messages: AdminInquiryMessage[];
  /** 가장 새 카드를 찾아 스크롤할 때 쓴다. 각 항목에 data-message-id 가 있다. */
  listRef?: Ref<HTMLOListElement>;
};

type CardProps = {
  message: AdminInquiryMessage;
  headingId: string;
  heading: string;
};

const QuestionCard = ({ message, headingId, heading }: CardProps) => (
  <article className={styles.question} aria-labelledby={headingId}>
    <h2 id={headingId} className={styles.cardTitle}>
      {heading}
    </h2>
    <p className={styles.body}>{message.body}</p>
    {message.attachments.length > 0 ? (
      <AttachmentGallery
        paths={message.attachments}
        ownerLabel={QUESTION_PHOTO_OWNER}
      />
    ) : null}
  </article>
);

const ReplyCard = ({ message, headingId }: Omit<CardProps, 'heading'>) => (
  <article className={styles.reply} aria-labelledby={headingId}>
    <h2 id={headingId} className={styles.cardTitleAccent}>
      {`운영자 답변 · ${formatInquiryDetailDate(message.createdAt)}`}
    </h2>
    <p className={styles.cardMeta}>{getEmailName(message.authorEmail)}</p>
    <p className={styles.body}>{message.body}</p>
    {message.attachments.length > 0 ? (
      <AttachmentGallery
        paths={message.attachments}
        ownerLabel={REPLY_PHOTO_OWNER}
      />
    ) : null}
  </article>
);

const MemoCard = ({ message, headingId }: Omit<CardProps, 'heading'>) => (
  <article className={styles.memo} data-kind="memo" aria-labelledby={headingId}>
    <h2 id={headingId} className={styles.memoTitle}>
      내부 메모 · 사용자에게 보이지 않음
    </h2>
    <p className={styles.memoMeta}>
      {`${getEmailName(message.authorEmail)} · ${formatInquiryDetailDate(message.createdAt)}`}
    </p>
    <p className={styles.body}>{message.body}</p>
  </article>
);

/** 서버가 준 시간순 그대로, 내부 메모를 포함해 그린다. */
export const MessageThread = ({ messages, listRef }: Props) => {
  const idPrefix = useId();
  const firstQuestionId = messages.find(
    (message) => message.kind === 'question',
  )?.id;

  return (
    <ol ref={listRef} className={styles.thread}>
      {messages.map((message) => {
        const headingId = `${idPrefix}-${message.id}`;
        const date = formatInquiryDetailDate(message.createdAt);

        return (
          <li key={message.id} data-message-id={message.id}>
            {message.kind === 'reply' ? (
              <ReplyCard message={message} headingId={headingId} />
            ) : message.kind === 'memo' ? (
              <MemoCard message={message} headingId={headingId} />
            ) : (
              <QuestionCard
                message={message}
                headingId={headingId}
                heading={
                  message.id === firstQuestionId
                    ? `사용자 · ${date}`
                    : `추가 문의 · ${date}`
                }
              />
            )}
          </li>
        );
      })}
    </ol>
  );
};

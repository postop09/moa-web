import { MessageSquare } from 'lucide-react';
import { useId } from 'react';

import { formatInquiryDetailDate } from '@/entities/inquiry';
import type { InquiryMessage } from '@/entities/inquiry';
import { AttachmentGallery } from '@/widgets/attachmentGallery';

import styles from './inquiryDetail.module.css';

type Props = {
  title: string;
  messages: InquiryMessage[];
};

export const MessageThread = ({ title, messages }: Props) => {
  const idPrefix = useId();
  // 내부 메모는 RLS 로 오지 않지만, 섞여 와도 사용자에게 보이지 않게 한 번 더 거른다.
  const visible = messages.filter((message) => message.kind !== 'memo');
  const firstQuestionId = visible.find(
    (message) => message.kind === 'question',
  )?.id;

  return (
    <ol className={styles.thread}>
      {visible.map((message) => {
        const headingId = `${idPrefix}-${message.id}`;

        return (
          <li key={message.id}>
            {message.kind === 'reply' ? (
              <article className={styles.reply} aria-labelledby={headingId}>
                <h2 id={headingId} className={styles.replyLabel}>
                  <span className={styles.replyIcon} aria-hidden>
                    <MessageSquare size={16} />
                  </span>
                  {`운영자 답변 · ${formatInquiryDetailDate(message.createdAt)}`}
                </h2>
                <p className={styles.body}>{message.body}</p>
                {message.attachments.length > 0 ? (
                  <AttachmentGallery
                    paths={message.attachments}
                    ownerLabel="운영자 답변"
                  />
                ) : null}
              </article>
            ) : (
              <article className={styles.question} aria-labelledby={headingId}>
                {message.id === firstQuestionId ? (
                  <h2 id={headingId} className={styles.questionTitle}>
                    {title}
                  </h2>
                ) : (
                  <h2 id={headingId} className={styles.followUpLabel}>
                    {`추가 문의 · ${formatInquiryDetailDate(message.createdAt)}`}
                  </h2>
                )}
                <p className={styles.body}>{message.body}</p>
                {message.attachments.length > 0 ? (
                  <AttachmentGallery
                    paths={message.attachments}
                    ownerLabel="내 문의"
                  />
                ) : null}
              </article>
            )}
          </li>
        );
      })}
    </ol>
  );
};

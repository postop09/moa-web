'use client';

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import type { Faq } from '@/entities/faq';

import styles from './support.module.css';

type ItemProps = {
  faq: Faq;
  isOpen: boolean;
  isVoted: boolean;
  onToggle: () => void;
  onHelpful: () => void;
};

const FaqItem = ({ faq, isOpen, isVoted, onToggle, onHelpful }: ItemProps) => {
  const answerId = useId();

  return (
    <li className={styles.faqItem}>
      <h3 className={styles.faqHeading}>
        <button
          type="button"
          className={styles.faqQuestion}
          aria-expanded={isOpen}
          aria-controls={answerId}
          onClick={onToggle}
        >
          <span>{faq.question}</span>
          <ChevronDown
            size={20}
            strokeWidth={2}
            className={isOpen ? styles.chevronOpen : styles.chevron}
            aria-hidden
          />
        </button>
      </h3>
      {isOpen ? (
        <div id={answerId} className={styles.faqAnswer}>
          <p className={styles.faqAnswerText}>{faq.answer}</p>
          {/* live region은 상태가 바뀌기 전에 존재해야 읽힌다. 같은 버튼을 제자리에서
              aria-disabled로 바꿔 포커스가 body로 떨어지지 않게 한다. */}
          <div role="status">
            <button
              type="button"
              className={isVoted ? styles.helpfulDone : styles.helpfulButton}
              aria-disabled={isVoted}
              onClick={isVoted ? undefined : onHelpful}
            >
              {isVoted ? '의견 주셔서 감사해요' : '도움이 됐어요'}
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
};

type Props = {
  faqs: Faq[];
  votedIds: ReadonlySet<string>;
  onHelpful: (faqId: string) => void;
};

export const FaqList = ({ faqs, votedIds, onHelpful }: Props) => {
  // 여러 질문을 동시에 펼쳐둘 수 있다(투표 후에도 다른 답변이 닫히지 않는다).
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(new Set());

  const toggle = (faqId: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(faqId)) next.add(faqId);
      return next;
    });

  return (
    <ul className={styles.faqList}>
      {faqs.map((faq) => (
        <FaqItem
          key={faq.id}
          faq={faq}
          isOpen={openIds.has(faq.id)}
          isVoted={votedIds.has(faq.id)}
          onToggle={() => toggle(faq.id)}
          onHelpful={() => onHelpful(faq.id)}
        />
      ))}
    </ul>
  );
};

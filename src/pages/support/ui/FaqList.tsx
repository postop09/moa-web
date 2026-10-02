'use client';

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import type { Faq } from '@/entities/faq';

import styles from './support.module.css';

type ItemProps = {
  faq: Faq;
  isOpen: boolean;
  onToggle: () => void;
};

const FaqItem = ({ faq, isOpen, onToggle }: ItemProps) => {
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
        </div>
      ) : null}
    </li>
  );
};

type Props = {
  faqs: Faq[];
};

export const FaqList = ({ faqs }: Props) => {
  // 여러 질문을 동시에 펼쳐둘 수 있다.
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
          onToggle={() => toggle(faq.id)}
        />
      ))}
    </ul>
  );
};

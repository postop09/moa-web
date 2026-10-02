'use client';

import { ChevronRight, Sparkles } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

import type { Faq } from '@/entities/faq';
import {
  getInquiryCategoryLabel,
  type InquiryCategory,
} from '@/entities/inquiry';
import { useFaqs } from '@/features/faq';
import { Button, Modal } from '@/shared/ui';

import styles from './inquiryWrite.module.css';

const MAX_SUGGESTIONS = 3;

type ListProps = {
  category: InquiryCategory;
  onCountChange: (count: number) => void;
};

const FaqList = ({ category, onCountChange }: ListProps) => {
  const titleId = useId();
  const { data } = useFaqs(category);
  const [selected, setSelected] = useState<Faq | null>(null);
  const faqs = data?.slice(0, MAX_SUGGESTIONS) ?? [];
  const count = faqs.length;

  useEffect(() => {
    onCountChange(count);

    return () => onCountChange(0);
  }, [count, onCountChange]);

  if (count === 0) return null;

  return (
    <section className={styles.suggest} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.suggestTitle}>
        <Sparkles size={16} aria-hidden />
        {`관련 도움말 · ${getInquiryCategoryLabel(category)}`}
      </h2>
      <ul className={styles.suggestList}>
        {faqs.map((faq) => (
          <li key={faq.id}>
            <button
              type="button"
              className={styles.suggestItem}
              onClick={() => setSelected(faq)}
            >
              <span>{faq.question}</span>
              <ChevronRight size={18} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <p className={styles.suggestFooter}>
        찾는 답변이 없나요? 그대로 문의를 등록해주세요.
      </p>
      {selected ? (
        <Modal title={selected.question} onClose={() => setSelected(null)}>
          <p className={styles.answer}>{selected.answer}</p>
          <Button variant="secondary" onClick={() => setSelected(null)}>
            닫기
          </Button>
        </Modal>
      ) : null}
    </section>
  );
};

type Props = {
  category: InquiryCategory | null;
  /** 분류가 진행되는 동안 목록이 나타나도 레이아웃이 밀리지 않게 자리를 잡는다. */
  reserveSpace: boolean;
};

/**
 * 항상 마운트되는 영역. 개수 안내(role=status)가 먼저 존재해야 목록이 나타날 때 읽힌다.
 * 목록 래퍼에는 aria-live 를 두지 않는다.
 */
export const SuggestedFaqs = ({ category, reserveSpace }: Props) => {
  const [count, setCount] = useState(0);

  return (
    <div className={reserveSpace ? styles.suggestSlotReserved : undefined}>
      <p role="status" className="srOnly">
        {count > 0 ? `추천 도움말 ${count}개가 있어요` : ''}
      </p>
      {category ? (
        <FaqList category={category} onCountChange={setCount} />
      ) : null}
    </div>
  );
};

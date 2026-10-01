import {
  INQUIRY_CATEGORIES,
  INQUIRY_CATEGORY_LABELS,
  type InquiryCategory,
} from '@/entities/inquiry';

import styles from './support.module.css';

type Props = {
  selected: InquiryCategory | null;
  /** 검색 중에는 카테고리가 적용되지 않으므로 칩을 비활성화하고 범위를 안내한다. */
  disabled?: boolean;
  onSelect: (category: InquiryCategory | null) => void;
};

export const CategoryChips = ({
  selected,
  disabled = false,
  onSelect,
}: Props) => {
  return (
    <div className={styles.chipsArea}>
      <div className={styles.chips} role="group" aria-label="질문 카테고리">
        <button
          type="button"
          className={styles.chip}
          aria-pressed={selected === null}
          disabled={disabled}
          onClick={() => onSelect(null)}
        >
          전체
        </button>
        {INQUIRY_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            className={styles.chip}
            aria-pressed={selected === category}
            disabled={disabled}
            onClick={() => onSelect(category)}
          >
            {INQUIRY_CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>
      {/* 라벨이 나타나도 레이아웃이 밀리지 않게 높이를 항상 확보한다. */}
      <p className={styles.scopeLabel}>
        {disabled ? '전체에서 검색 중' : null}
      </p>
    </div>
  );
};

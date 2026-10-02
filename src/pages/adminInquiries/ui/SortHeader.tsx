import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

import styles from './adminInquiries.module.css';

type Props = {
  label: string;
  /** 화면에 보이는 정렬 방향. 정렬 중이 아니면 null. */
  direction: 'ascending' | 'descending' | null;
  onSort: () => void;
  /** 버튼의 보조 설명 요소 id. th 텍스트(컬럼명)에 섞이지 않도록 표 밖에 둔 요소를 가리킨다. */
  descriptionId?: string;
};

export const SortHeader = ({
  label,
  direction,
  onSort,
  descriptionId,
}: Props) => {
  const Icon =
    direction === 'ascending'
      ? ArrowUp
      : direction === 'descending'
        ? ArrowDown
        : ArrowUpDown;

  return (
    <th
      scope="col"
      className={`${styles.th} ${styles.numeric}`}
      aria-sort={direction ?? 'none'}
    >
      <button
        type="button"
        className={styles.sortButton}
        aria-describedby={descriptionId}
        onClick={onSort}
      >
        {label}
        {/* 정렬 중이 아닌 헤더는 중립 아이콘으로 눌러서 정렬할 수 있음을 알린다. */}
        <Icon
          size={14}
          strokeWidth={2.25}
          className={direction ? undefined : styles.sortIconIdle}
          aria-hidden="true"
        />
      </button>
    </th>
  );
};

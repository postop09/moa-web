import { Search } from 'lucide-react';

import styles from './support.module.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export const FaqSearchInput = ({ value, onChange }: Props) => {
  return (
    <div className={styles.search}>
      <Search size={20} strokeWidth={2} aria-hidden />
      <input
        type="search"
        className={styles.searchInput}
        aria-label="자주 묻는 질문 검색"
        placeholder="궁금한 내용을 검색하세요"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
};

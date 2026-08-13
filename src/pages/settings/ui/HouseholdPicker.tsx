'use client';

import type { Household } from '@/entities/household';

import styles from '../settings.module.css';

type Props = {
  households: Household[];
  householdId: string | null;
  onChange: (householdId: string) => void;
  disabled?: boolean;
};

export const HouseholdPicker = ({
  households,
  householdId,
  onChange,
  disabled = false,
}: Props) => {
  if (households.length === 0) {
    return <p className={styles.empty}>참여 중인 가계부가 없습니다.</p>;
  }

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor="householdPicker">
        가계부
      </label>
      <select
        id="householdPicker"
        className={styles.select}
        value={householdId ?? ''}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {households.map((household) => (
          <option key={household.id} value={household.id}>
            {household.name}
          </option>
        ))}
      </select>
    </div>
  );
};

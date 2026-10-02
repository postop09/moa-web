import { useId } from 'react';

import type { AdminInquiry } from '@/entities/admin';

import { getDeviceRows } from '../lib/getDeviceRows';

import styles from './sidePanel.module.css';

type Props = {
  deviceInfo: AdminInquiry['deviceInfo'];
};

export const DeviceInfoSection = ({ deviceInfo }: Props) => {
  const titleId = useId();
  const rows = getDeviceRows(deviceInfo);

  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.sectionLabel}>
        기기 정보
      </h2>
      {rows.length === 0 ? (
        <p className={styles.muted}>기기 정보를 보내지 않았어요</p>
      ) : (
        <dl className={styles.definitions}>
          {rows.map(({ label, value }) => (
            <div key={label} className={styles.definition}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
};

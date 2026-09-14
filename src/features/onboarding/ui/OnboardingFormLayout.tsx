import type { ReactNode } from 'react';

import { GridBackdrop, MoaLogo } from '@/shared/ui';

import styles from './onboardingForm.module.css';

type Props = {
  headline: string;
  description: string;
  children: ReactNode;
};

export const OnboardingFormLayout = ({
  headline,
  description,
  children,
}: Props) => {
  return (
    <main className={styles.page}>
      <GridBackdrop />
      <div className={styles.panel}>
        <header className={styles.hero}>
          <MoaLogo variant="black" size={72} className={styles.brand} />
          <h1 className={styles.headline}>{headline}</h1>
          <p className={styles.support}>{description}</p>
        </header>
        {children}
      </div>
    </main>
  );
};

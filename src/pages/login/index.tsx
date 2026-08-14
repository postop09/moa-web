import { GridBackdrop } from '@/shared/ui';

import { BrandHero } from './ui/BrandHero';
import { GoogleSignInButton } from './ui/GoogleSignInButton';
import styles from './ui/login.module.css';

type Props = {
  next?: string | null;
};

export const LoginPage = ({ next }: Props) => {
  return (
    <main className={styles.page}>
      <GridBackdrop />
      <div className={styles.panel}>
        <BrandHero />
        <GoogleSignInButton next={next} />
      </div>
    </main>
  );
};

import { GridBackdrop } from '@/shared/ui';

import { BrandHero } from './ui/BrandHero';
import { GoogleSignInButton } from './ui/GoogleSignInButton';
import styles from './ui/login.module.css';

export const LoginPage = () => {
  return (
    <main className={styles.page}>
      <GridBackdrop />
      <div className={styles.panel}>
        <BrandHero />
        <GoogleSignInButton />
      </div>
    </main>
  );
};

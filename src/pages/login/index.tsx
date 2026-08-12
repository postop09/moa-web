import { BrandHero } from './ui/BrandHero';
import { GoogleSignInButton } from './ui/GoogleSignInButton';
import { GridBackdrop } from './ui/GridBackdrop';
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

import Link from 'next/link';

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
        <Link href="/welcome" className={styles.welcomeLink}>
          모아 소개 보기
        </Link>
      </div>
    </main>
  );
};

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
      <nav className={styles.policyLinks} aria-label="정책">
        <Link href="/privacy" className={styles.policyLink}>
          개인정보처리방침
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/terms" className={styles.policyLink}>
          이용약관
        </Link>
      </nav>
    </main>
  );
};

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { resolveAuthGate } from '@/features/onboarding/server';
import { LoginPage } from '@/pages/login';
import { getWebApplicationJsonLd } from '@/shared/config';
import { getSafeNextPath } from '@/shared/lib';

export const metadata: Metadata = {
  title: '로그인',
  alternates: {
    canonical: '/login',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    url: '/login',
  },
};

type Props = {
  searchParams: Promise<{ next?: string }>;
};

const LoginRoutePage = async ({ searchParams }: Props) => {
  const { next } = await searchParams;
  const safeNext = getSafeNextPath(next);
  const gate = await resolveAuthGate();

  if (gate.status !== 'unauthenticated') {
    redirect(safeNext ?? '/');
  }

  const jsonLd = getWebApplicationJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <LoginPage next={safeNext} />
    </>
  );
};

export default LoginRoutePage;

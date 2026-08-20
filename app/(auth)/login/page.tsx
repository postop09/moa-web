import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { LoginPage } from '@/pages/login';
import { createServerClient } from '@/shared/api/server';
import { getWebApplicationJsonLd } from '@/shared/config';
import { getAuthCompletePath, getSafeNextPath } from '@/shared/lib';

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
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(getAuthCompletePath(safeNext));
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

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { LoginPage } from '@/pages/login';
import { createServerClient } from '@/shared/api/server';
import { getAuthCompletePath, getSafeNextPath } from '@/shared/lib';

// 로그인 화면은 색인할 콘텐츠가 없고 랜딩(/welcome)과 내용이 중복되므로 제외한다.
export const metadata: Metadata = {
  title: '로그인',
  robots: {
    index: false,
    follow: true,
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

  return <LoginPage next={safeNext} />;
};

export default LoginRoutePage;

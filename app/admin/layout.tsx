import type { Metadata } from 'next';
import { type ReactNode } from 'react';

import { requireAdmin } from '@/entities/admin/server';
import { AdminShell } from '@/widgets/adminShell';

export const metadata: Metadata = {
  title: {
    default: '문의 관리',
    template: '%s | 모아 어드민',
  },
  robots: {
    index: false,
    follow: false,
  },
};

type Props = {
  children: ReactNode;
};

// 운영자만 볼 수 있다. 아니면 404(proxy 는 로그인 여부만 확인한다).
const AdminLayout = async ({ children }: Props) => {
  await requireAdmin();

  return <AdminShell>{children}</AdminShell>;
};

export default AdminLayout;

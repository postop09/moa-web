import type { Metadata } from 'next';
import { type ReactNode } from 'react';

import { AppShell } from '@/widgets/appShell';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type Props = {
  children: ReactNode;
};

const AppLayout = ({ children }: Props) => {
  return <AppShell>{children}</AppShell>;
};

export default AppLayout;

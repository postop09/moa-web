'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { writeHref } from '@/shared/config';

import styles from './appShell.module.css';

export const WriteFab = () => {
  const pathname = usePathname() ?? '';

  if (pathname === writeHref || pathname.startsWith(`${writeHref}/`)) {
    return null;
  }

  return (
    <Link href={writeHref} className={styles.fab} aria-label="가계부 작성">
      <Plus size={24} strokeWidth={2} aria-hidden />
    </Link>
  );
};

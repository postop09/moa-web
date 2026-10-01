'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { writeHref } from '@/shared/config';

import styles from './appShell.module.css';

const supportHref = '/support';

export const WriteFab = () => {
  const pathname = usePathname() ?? '';

  const isHidden = [writeHref, supportHref].some(
    (href) => pathname === href || pathname.startsWith(`${href}/`),
  );

  if (isHidden) {
    return null;
  }

  return (
    <Link href={writeHref} className={styles.fab} aria-label="가계부 작성">
      <Plus size={24} strokeWidth={2} aria-hidden />
    </Link>
  );
};

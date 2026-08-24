import Link from 'next/link';

import { contactEmail, siteName } from '@/shared/config';
import { MoaLogo } from '@/shared/ui';

import { FOOTER_LINK_GROUPS } from '../config/footerLinks';
import styles from './siteFooter.module.css';

const currentYear = new Date().getFullYear();

export const SiteFooter = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandArea}>
          <Link href="/welcome" className={styles.brand}>
            <MoaLogo variant="black" size={28} alt="" />
            {siteName}
          </Link>
          <p className={styles.tagline}>
            그래프로 보는 가계부. 수입과 지출, 저축의 흐름을 한눈에.
          </p>
          <a href={`mailto:${contactEmail}`} className={styles.contact}>
            {contactEmail}
          </a>
        </div>

        <nav className={styles.linkArea} aria-label="사이트 정보">
          {FOOTER_LINK_GROUPS.map((group) => (
            <div key={group.id} className={styles.linkGroup}>
              <p id={`footer-${group.id}`} className={styles.linkGroupTitle}>
                {group.title}
              </p>
              <ul
                className={styles.linkList}
                aria-labelledby={`footer-${group.id}`}
              >
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={styles.link}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className={styles.bottom}>
        <div className={styles.bottomInner}>
          <p className={styles.copyright}>
            © {currentYear} {siteName}. All rights reserved.
          </p>
          <p className={styles.notice}>
            모아는 가계 기록을 돕는 도구이며 금융·세무 자문을 제공하지 않습니다.
          </p>
        </div>
      </div>
    </footer>
  );
};

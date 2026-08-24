import {
  Monitor,
  PlusSquare,
  RefreshCw,
  Share,
  Smartphone,
} from 'lucide-react';

import { MoaLogo } from '@/shared/ui';

import { WELCOME_SECTION_IDS } from '../config/sections';
import { ProductFrame } from './ProductFrame';
import styles from './welcome.module.css';

const INSTALL_STEPS = [
  {
    id: 'share',
    icon: Share,
    title: '공유 또는 브라우저 메뉴',
    description:
      'iOS는 하단 공유 버튼을, Android·Chrome은 브라우저 메뉴에서 설치를 고릅니다.',
  },
  {
    id: 'add',
    icon: PlusSquare,
    title: '홈 화면에 추가',
    description: '앱스토어 없이 “홈 화면에 추가” 또는 “앱 설치”를 선택하세요.',
  },
  {
    id: 'open',
    icon: Smartphone,
    title: '앱처럼 실행',
    description:
      '홈 화면 아이콘으로 모아를 열면 주소창 없이 단독 화면으로 동작합니다.',
  },
] as const;

const DEVICE_POINTS = [
  {
    id: 'desktop',
    icon: Monitor,
    title: '노트북에서는 그래프를 넓게',
    description: '넓은 화면의 대시보드로 한 달의 흐름을 한 화면에 펼칩니다.',
  },
  {
    id: 'mobile',
    icon: Smartphone,
    title: '휴대폰에서는 빠르게',
    description: '설치 없이도 휴대폰에서 내 자산과 소비를 확인하고 기록합니다.',
  },
  {
    id: 'sync',
    icon: RefreshCw,
    title: '같은 가계부가 이어집니다',
    description: '모든 기기에서 동일한 서비스를 이용합니다.',
  },
] as const;

const MOBILE_TABS = [
  { id: 'home', label: '홈', active: true },
  { id: 'history', label: '내역', active: false },
  { id: 'calendar', label: '달력', active: false },
  { id: 'settings', label: '설정', active: false },
] as const;

export const PwaGuideSection = () => {
  return (
    <section
      id={WELCOME_SECTION_IDS.pwa}
      className={`${styles.section} ${styles.sectionAlt}`}
      aria-labelledby="pwa-guide-title"
    >
      <div className={styles.sectionInner}>
        <p className={styles.eyebrow}>웹 앱</p>
        <h2 id="pwa-guide-title" className={styles.sectionTitle}>
          설치 없이, 어느 기기에서나
        </h2>
        <p className={styles.sectionLead}>
          Google 계정과 브라우저만 있으면 됩니다. 홈 화면에 추가하면 앱처럼
          실행됩니다.
        </p>

        <div className={styles.pwaBlock}>
          <h3 className={styles.subheading}>홈 화면에 추가하기</h3>
          <div className={styles.pwaLayout}>
            <ol className={styles.pwaCardGrid}>
              {INSTALL_STEPS.map((step) => {
                const Icon = step.icon;

                return (
                  <li key={step.id} className={styles.pwaCard}>
                    <span className={styles.pwaIconWrap} aria-hidden>
                      <Icon size={20} strokeWidth={1.75} />
                    </span>
                    <h4 className={styles.pwaStepTitle}>{step.title}</h4>
                    <p className={styles.pwaStepText}>{step.description}</p>
                  </li>
                );
              })}
            </ol>

            <div className={styles.homeScreen} aria-hidden>
              <div className={styles.homeScreenStatus}>9:41</div>
              <div className={styles.homeScreenGrid}>
                <div className={`${styles.homeApp} ${styles.homeAppActive}`}>
                  <span className={styles.homeAppIcon}>
                    <MoaLogo variant="black" size={28} />
                  </span>
                  <span className={styles.homeAppLabel}>모아</span>
                </div>
                <div className={styles.homeApp}>
                  <span className={styles.homeAppIconMuted} />
                  <span className={styles.homeAppLabel}>캘린더</span>
                </div>
                <div className={styles.homeApp}>
                  <span className={styles.homeAppIconMuted} />
                  <span className={styles.homeAppLabel}>메모</span>
                </div>
                <div className={styles.homeApp}>
                  <span className={styles.homeAppIconMuted} />
                  <span className={styles.homeAppLabel}>사진</span>
                </div>
              </div>
              <p className={styles.homeScreenCaption}>홈 화면에 추가됨</p>
            </div>
          </div>
        </div>

        <div className={styles.pwaBlock}>
          <h3 className={styles.subheading}>노트북에서도, 휴대폰에서도</h3>
          <div className={styles.deviceStage} aria-hidden>
            <ProductFrame />

            <div className={styles.mobileFrame}>
              <div className={styles.mobileStatus}>9:41</div>
              <div className={styles.mobileMain}>
                <p className={styles.desktopKicker}>잔액</p>
                <p className={styles.mobileBalance}>1,400,000원</p>
                <div className={styles.stackBarTrack}>
                  <div
                    className={styles.barFillExpense}
                    style={{ width: '20%' }}
                  />
                  <div
                    className={styles.barFillSaving}
                    style={{ width: '33%' }}
                  />
                </div>
              </div>
              <div className={styles.mobileTabs}>
                {MOBILE_TABS.map((item) => (
                  <span
                    key={item.id}
                    className={`${styles.mobileTab} ${
                      item.active ? styles.mobileTabActive : ''
                    }`}
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <ul className={styles.pointList}>
            {DEVICE_POINTS.map((point) => {
              const Icon = point.icon;

              return (
                <li key={point.id} className={styles.pointItem}>
                  <span className={styles.pwaIconWrap} aria-hidden>
                    <Icon size={20} strokeWidth={1.75} />
                  </span>
                  <div>
                    <h4 className={styles.pwaStepTitle}>{point.title}</h4>
                    <p className={styles.pwaStepText}>{point.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
};

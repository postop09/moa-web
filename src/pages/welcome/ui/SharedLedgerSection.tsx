import { Palette, ShieldCheck, UserPlus } from 'lucide-react';
import type { CSSProperties } from 'react';

import { WELCOME_SECTION_IDS } from '../config/sections';
import styles from './welcome.module.css';

const SHARE_POINTS = [
  {
    id: 'invite',
    icon: UserPlus,
    title: '초대 링크로 부르기',
    description:
      '초대할 이메일을 적으면 링크가 만들어집니다. 받은 사람이 같은 Google 계정으로 열면 바로 참여합니다.',
  },
  {
    id: 'author',
    icon: Palette,
    title: '누가 썼는지 색으로 구분',
    description:
      '거래와 일정에 작성자가 남습니다. 달력에서 작성자별 색으로 보고, 원하는 사람만 골라 볼 수 있습니다.',
  },
  {
    id: 'role',
    icon: ShieldCheck,
    title: '소유자와 멤버',
    description:
      '소유자는 초대와 멤버 정리, 가계부 삭제를 맡습니다. 멤버는 언제든 가계부에서 나갈 수 있습니다.',
  },
] as const;

const AUTHOR_CHIPS = [
  { id: 'all', label: '전체', color: 'var(--color-accent)' },
  { id: 'jihoon', label: '지훈 (나)', color: '#2563eb' },
  { id: 'sua', label: '수아', color: '#c026d3' },
] as const;

const MEMBERS = [
  {
    id: 'jihoon',
    initial: '지',
    name: '지훈',
    email: 'jihoon@example.com',
    role: '소유자',
    color: '#2563eb',
    owner: true,
  },
  {
    id: 'sua',
    initial: '수',
    name: '수아',
    email: 'sua@example.com',
    role: '멤버',
    color: '#c026d3',
    owner: false,
  },
] as const;

export const SharedLedgerSection = () => {
  return (
    <section
      id={WELCOME_SECTION_IDS.share}
      className={styles.section}
      aria-labelledby="shared-ledger-title"
    >
      <div className={styles.sectionInner}>
        <div className={styles.splitLayout}>
          <div className={styles.splitCopy}>
            <p className={styles.eyebrow}>공유</p>
            <h2 id="shared-ledger-title" className={styles.sectionTitle}>
              한 가계부, 여러 사람
            </h2>
            <p className={styles.sectionLead}>
              가족·룸메이트를 초대하면 거래와 카테고리, 일정까지 같은 가계부에서
              함께 관리합니다. 각자 적어도 흐름은 하나로 모입니다.
            </p>

            <div className={styles.filterChips} aria-hidden>
              {AUTHOR_CHIPS.map((chip) => (
                <span
                  key={chip.id}
                  className={styles.filterChip}
                  style={{ '--chip-color': chip.color } as CSSProperties}
                >
                  <span className={styles.filterChipDot} />
                  {chip.label}
                </span>
              ))}
            </div>

            <ul className={styles.sharePoints}>
              {SHARE_POINTS.map((point) => {
                const Icon = point.icon;

                return (
                  <li key={point.id} className={styles.pointItem}>
                    <span className={styles.pwaIconWrap} aria-hidden>
                      <Icon size={20} strokeWidth={1.75} />
                    </span>
                    <div>
                      <h3 className={styles.pwaStepTitle}>{point.title}</h3>
                      <p className={styles.pwaStepText}>{point.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={styles.memberMock} aria-hidden>
            <div className={styles.memberMockHeader}>
              <span>멤버</span>
              <span className={styles.memberCount}>3</span>
            </div>

            <ul className={styles.memberList}>
              {MEMBERS.map((member) => (
                <li key={member.id} className={styles.memberRow}>
                  <span
                    className={styles.memberAvatar}
                    style={{ '--avatar-color': member.color } as CSSProperties}
                  >
                    {member.initial}
                  </span>
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>{member.name}</span>
                    <span className={styles.memberEmail}>{member.email}</span>
                  </div>
                  <span
                    className={`${styles.memberBadge} ${
                      member.owner ? styles.memberBadgeOwner : ''
                    }`}
                  >
                    {member.role}
                  </span>
                </li>
              ))}

              <li className={styles.memberRow}>
                <span className={styles.memberAvatarPending}>+</span>
                <div className={styles.memberInfo}>
                  <span className={styles.memberName}>minji@example.com</span>
                  <span className={styles.memberEmail}>초대 대기</span>
                </div>
                <span className={styles.memberPending}>수락 대기 중</span>
              </li>
            </ul>

            <div className={styles.inviteBar}>
              <span className={styles.inviteUrl}>moa.app/invite/8f2c…</span>
              <span className={styles.inviteCopy}>링크 복사</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

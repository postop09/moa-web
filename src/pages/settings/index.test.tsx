import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCurrentHousehold } from '@/features/household';
import { useUnreadReplyCount } from '@/features/inquiry';
import { useGetProfile } from '@/features/profile';

import { SettingsPage } from './index';

vi.mock('@/features/household', () => ({
  useCurrentHousehold: vi.fn(),
  HouseholdPageTitle: () => <h1>가계부 설정</h1>,
}));

vi.mock('@/features/profile', () => ({
  useGetProfile: vi.fn(),
}));

vi.mock('@/features/inquiry', () => ({
  useUnreadReplyCount: vi.fn(),
}));

// 무거운 섹션은 제목만 렌더하는 스텁으로 대체한다. SupportSection은 실제 컴포넌트를 쓴다.
vi.mock('./ui/AccountSection', () => ({
  AccountSection: () => (
    <section>
      <h2>계정</h2>
    </section>
  ),
}));
vi.mock('./ui/MembersSection', () => ({
  MembersSection: () => (
    <section>
      <h2>멤버</h2>
    </section>
  ),
}));
vi.mock('./ui/CategorySection', () => ({
  CategorySection: () => (
    <section>
      <h2>카테고리</h2>
    </section>
  ),
}));
vi.mock('./ui/HouseholdDangerSection', () => ({
  HouseholdDangerSection: () => (
    <section>
      <h2>가계부</h2>
    </section>
  ),
}));

const PROFILE = { id: 'u1', email: 'a@b.com' };
const HOUSEHOLD = { id: 'h1', name: '우리집', ownerId: 'u1' };

const headings = () =>
  screen
    .getAllByRole('heading', { level: 2 })
    .map((heading) => heading.textContent);

describe('SettingsPage 섹션 순서', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUnreadReplyCount).mockReturnValue({ data: 0 } as never);
  });

  it('가계부와 프로필이 있으면 계정 → 멤버 → 카테고리 → 도움말 → 가계부 순서다', () => {
    vi.mocked(useCurrentHousehold).mockReturnValue({
      household: HOUSEHOLD,
      householdId: 'h1',
    } as never);
    vi.mocked(useGetProfile).mockReturnValue({ data: PROFILE } as never);

    render(<SettingsPage />);

    expect(headings()).toEqual([
      '계정',
      '멤버',
      '카테고리',
      '도움말',
      '가계부',
    ]);
  });

  it('가계부가 없으면 멤버/카테고리/가계부 섹션 없이 계정 다음에 도움말이 보인다', () => {
    vi.mocked(useCurrentHousehold).mockReturnValue({
      household: undefined,
      householdId: undefined,
    } as never);
    vi.mocked(useGetProfile).mockReturnValue({ data: PROFILE } as never);

    render(<SettingsPage />);

    expect(headings()).toEqual(['계정', '도움말']);
  });
});

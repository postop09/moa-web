import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUnreadReplyCount } from '@/features/inquiry';

import { SupportSection } from './SupportSection';

vi.mock('@/features/inquiry', () => ({
  useUnreadReplyCount: vi.fn(),
}));

const mockUnread = (count: number | undefined) => {
  vi.mocked(useUnreadReplyCount).mockReturnValue({
    data: count,
  } as ReturnType<typeof useUnreadReplyCount>);
};

describe('SupportSection', () => {
  beforeEach(() => {
    vi.mocked(useUnreadReplyCount).mockReset();
  });

  it('고객센터 링크가 /support를 가리킨다', () => {
    mockUnread(0);
    render(<SupportSection />);

    expect(screen.getByRole('link', { name: /고객센터/ })).toHaveAttribute(
      'href',
      '/support',
    );
  });

  it('미확인 답변이 있으면 "새 답변 N" 뱃지를 보여준다', () => {
    mockUnread(2);
    render(<SupportSection />);

    expect(screen.getByText('새 답변 2')).toBeInTheDocument();
  });

  it.each([0, undefined])(
    '미확인 답변이 %s이면 뱃지를 보여주지 않는다',
    (count) => {
      mockUnread(count);
      render(<SupportSection />);

      expect(screen.queryByText(/새 답변/)).not.toBeInTheDocument();
    },
  );
});

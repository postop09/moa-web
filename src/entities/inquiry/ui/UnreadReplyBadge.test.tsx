import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { UnreadReplyBadge } from '@/entities/inquiry';

describe('UnreadReplyBadge', () => {
  it('count 가 없으면 "새 답변" 만 보인다', () => {
    render(<UnreadReplyBadge />);

    expect(screen.getByText('새 답변')).toBeInTheDocument();
  });

  it('count 가 있으면 "새 답변 N" 으로 보인다', () => {
    render(<UnreadReplyBadge count={3} />);

    expect(screen.getByText('새 답변 3')).toBeInTheDocument();
  });
});

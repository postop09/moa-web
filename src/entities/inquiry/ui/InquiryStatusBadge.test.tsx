import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InquiryStatusBadge } from '@/entities/inquiry';

const tone = (label: string) =>
  screen.getByText(label).closest('[data-tone]')?.getAttribute('data-tone');

describe('InquiryStatusBadge', () => {
  it('waiting 은 "답변 대기" 텍스트와 neutral 톤', () => {
    render(<InquiryStatusBadge status="waiting" />);

    expect(tone('답변 대기')).toBe('neutral');
  });

  it('in_progress 도 사용자에게는 "답변 대기" 로 보인다', () => {
    render(<InquiryStatusBadge status="in_progress" />);

    expect(screen.getByText('답변 대기')).toBeInTheDocument();
    expect(screen.queryByText('처리 중')).not.toBeInTheDocument();
    expect(tone('답변 대기')).toBe('neutral');
  });

  it('answered 는 "답변 완료" 텍스트와 accent 톤', () => {
    render(<InquiryStatusBadge status="answered" />);

    expect(tone('답변 완료')).toBe('accent');
  });

  it('closed 는 "종결" 텍스트와 neutral 톤', () => {
    render(<InquiryStatusBadge status="closed" />);

    expect(tone('종결')).toBe('neutral');
  });
});

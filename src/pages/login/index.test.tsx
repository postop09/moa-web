import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// 세션 만료로 proxy가 /login에 보낸 경로는 useSignOut을 거치지 않으므로,
// LoginPage 자체가 클라이언트 상태 초기화 컴포넌트를 마운트해야 한다.
// 초기화 동작 자체는 ui/ResetClientState.test.tsx에서 검증하고, 여기서는 조립만 확인한다.
vi.mock('./ui/ResetClientState', () => ({
  ResetClientState: () => <div data-testid="reset-client-state" />,
}));

// GoogleSignInButton은 supabase 브라우저 클라이언트에 의존하므로 화면 표시만 남긴다.
vi.mock('./ui/GoogleSignInButton', () => ({
  GoogleSignInButton: () => <button type="button">Google로 계속하기</button>,
}));

import { LoginPage } from './index';

describe('LoginPage', () => {
  it('마운트 시 클라이언트 상태 초기화(ResetClientState)를 렌더한다', () => {
    render(<LoginPage />);

    expect(screen.getByTestId('reset-client-state')).toBeInTheDocument();
  });

  it('로그인 버튼은 그대로 보여준다', () => {
    render(<LoginPage />);

    expect(
      screen.getByRole('button', { name: 'Google로 계속하기' }),
    ).toBeInTheDocument();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAuthCompletePath } from '@/shared/lib';

import { clearAuthGateReadyCookie } from './authGateCookieActions';
import { redirectIfNoHouseholds } from './redirectIfNoHouseholds';

vi.mock('./authGateCookieActions', () => ({
  clearAuthGateReadyCookie: vi.fn(),
}));

const createRouter = () => ({ replace: vi.fn() });

describe('redirectIfNoHouseholds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('가계부가 있으면 false를 반환하고 리다이렉트하지 않는다', async () => {
    const router = createRouter();

    const result = await redirectIfNoHouseholds([{ id: 'h1' }], router);

    expect(result).toBe(false);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('가계부가 비면 true를 반환하고 /auth/complete로 1회 리다이렉트한다', async () => {
    const router = createRouter();

    const result = await redirectIfNoHouseholds([], router);

    expect(result).toBe(true);
    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith(getAuthCompletePath());
    expect(router.replace).toHaveBeenCalledWith('/auth/complete');
  });

  it('가계부 목록이 undefined여도 true를 반환하고 /auth/complete로 1회 리다이렉트한다', async () => {
    const router = createRouter();

    const result = await redirectIfNoHouseholds(undefined, router);

    expect(result).toBe(true);
    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/auth/complete');
  });

  it('서버 액션 clearAuthGateReadyCookie를 호출하지 않는다', async () => {
    const router = createRouter();

    await redirectIfNoHouseholds([], router);
    await redirectIfNoHouseholds(undefined, router);
    await redirectIfNoHouseholds([{ id: 'h1' }], router);

    expect(clearAuthGateReadyCookie).not.toHaveBeenCalled();
  });
});

// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requireAdmin } from './server';

const rpcMock = vi.fn();
const createServerClientMock = vi.fn();
const notFoundMock = vi.fn();

class NotFoundSignal extends Error {}

vi.mock('@/shared/api/server', () => ({
  createServerClient: () => createServerClientMock(),
}));

vi.mock('next/navigation', () => ({
  notFound: () => notFoundMock(),
}));

describe('requireAdmin', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    createServerClientMock.mockResolvedValue({ rpc: rpcMock });
    // 실제 notFound() 는 예외를 던져 렌더링을 중단한다.
    notFoundMock.mockImplementation(() => {
      throw new NotFoundSignal('NEXT_NOT_FOUND');
    });
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('is_admin RPC 가 true 면 notFound 없이 정상 반환한다', async () => {
    rpcMock.mockResolvedValue({ data: true, error: null });

    await expect(requireAdmin()).resolves.toBeUndefined();
    expect(rpcMock).toHaveBeenCalledWith('is_admin');
    expect(notFoundMock).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('관리자가 아니면 notFound() 로 막는다', async () => {
    rpcMock.mockResolvedValue({ data: false, error: null });

    await expect(requireAdmin()).rejects.toBeInstanceOf(NotFoundSignal);
    expect(notFoundMock).toHaveBeenCalledTimes(1);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('is_admin 결과가 null(비로그인 등)이어도 notFound()', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });

    await expect(requireAdmin()).rejects.toBeInstanceOf(NotFoundSignal);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('RPC 에러는 관리자 여부를 알 수 없으므로 notFound() (통과시키지 않는다)', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { code: 'P0001', message: 'unauthorized' },
    });

    await expect(requireAdmin()).rejects.toBeInstanceOf(NotFoundSignal);
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it('RPC 호출 자체가 예외를 던져도 notFound() 이고 원래 에러를 노출하지 않는다', async () => {
    rpcMock.mockRejectedValue(new Error('network'));

    await expect(requireAdmin()).rejects.toBeInstanceOf(NotFoundSignal);
  });

  describe('확인 실패는 서버 로그에 남긴다 (여전히 404 로 막는다)', () => {
    const logged = () => consoleError.mock.calls.flat().map(String).join(' ');

    it('RPC 에러면 console.error 를 한 번, 고정 접두어와 에러 코드로 남기고 notFound() 한다', async () => {
      rpcMock.mockResolvedValue({
        data: null,
        error: {
          code: 'P0001',
          message: 'jwt abc.secret.token',
          details: 'Bearer secret-token-123',
        },
      });

      await expect(requireAdmin()).rejects.toBeInstanceOf(NotFoundSignal);

      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(logged()).toContain('requireAdmin');
      expect(logged()).toContain('P0001');
      expect(logged()).not.toContain('secret');
      expect(logged()).not.toContain('Bearer');
      expect(notFoundMock).toHaveBeenCalledTimes(1);
    });

    it('RPC 호출이 reject 되어도 한 번 남기고, 토큰 같은 민감한 값은 담지 않는다', async () => {
      rpcMock.mockRejectedValue(new Error('fetch failed: Bearer secret-token'));

      await expect(requireAdmin()).rejects.toBeInstanceOf(NotFoundSignal);

      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(logged()).toContain('requireAdmin');
      expect(logged()).not.toContain('secret-token');
      expect(notFoundMock).toHaveBeenCalledTimes(1);
    });

    it('서버 클라이언트 생성이 실패해도 한 번 남기고 notFound() 한다', async () => {
      createServerClientMock.mockRejectedValue(new Error('no cookies'));

      await expect(requireAdmin()).rejects.toBeInstanceOf(NotFoundSignal);

      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(logged()).toContain('requireAdmin');
    });
  });
});

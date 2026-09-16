import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SUPABASE_URL = 'https://example.supabase.co';
const JWKS_URL = `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`;
const TEN_MINUTES_MS = 10 * 60 * 1000;

const sampleKeys = [{ kid: 'key-1', kty: 'EC', crv: 'P-256', x: 'x', y: 'y' }];

// 구현이 전역 fetch의 Response를 `ok`/`json()`으로만 소비한다고 가정하고
// 최소 형태의 응답 객체를 사용한다.
const createResponse = (body: unknown, ok = true) =>
  ({
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
  }) as unknown as Response;

const loadModule = async () => {
  const mod = await import('./getSupabaseJwks');

  return mod.getSupabaseJwks;
};

describe('getSupabaseJwks', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE_URL);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('NEXT_PUBLIC_SUPABASE_URL 기반 JWKS 엔드포인트로 fetch 한다', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      createResponse({ keys: sampleKeys }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const getSupabaseJwks = await loadModule();
    await getSupabaseJwks();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(JWKS_URL);
  });

  it('응답이 ok이고 keys 배열이 있으면 { keys }를 반환한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => createResponse({ keys: sampleKeys })),
    );

    const getSupabaseJwks = await loadModule();
    const result = await getSupabaseJwks();

    expect(result).toEqual({ keys: sampleKeys });
  });

  it('TTL(10분) 안의 두 번째 호출은 fetch 없이 캐시된 값을 반환한다', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    const fetchMock = vi.fn<typeof fetch>(async () =>
      createResponse({ keys: sampleKeys }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const getSupabaseJwks = await loadModule();
    const first = await getSupabaseJwks();

    vi.advanceTimersByTime(TEN_MINUTES_MS - 1);

    const second = await getSupabaseJwks();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it('TTL(10분)이 지나면 다시 fetch 한다', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    const freshKeys = [
      { kid: 'key-2', kty: 'EC', crv: 'P-256', x: 'x2', y: 'y2' },
    ];
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createResponse({ keys: sampleKeys }))
      .mockResolvedValueOnce(createResponse({ keys: freshKeys }));
    vi.stubGlobal('fetch', fetchMock);

    const getSupabaseJwks = await loadModule();
    await getSupabaseJwks();

    vi.advanceTimersByTime(TEN_MINUTES_MS + 1);

    const result = await getSupabaseJwks();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ keys: freshKeys });
  });

  it('in-flight 중 동시에 호출되면 fetch는 1번만 일어난다', async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    const fetchMock = vi.fn<typeof fetch>(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const getSupabaseJwks = await loadModule();
    const pending = Promise.all([getSupabaseJwks(), getSupabaseJwks()]);

    // 두 호출이 모두 시작된 뒤 응답을 내려준다.
    await Promise.resolve();
    resolveFetch?.(createResponse({ keys: sampleKeys }));

    const [first, second] = await pending;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toEqual({ keys: sampleKeys });
    expect(second).toEqual({ keys: sampleKeys });
  });

  it('fetch가 reject되면 undefined를 반환하고 throw 하지 않는다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => {
        throw new Error('network down');
      }),
    );

    const getSupabaseJwks = await loadModule();

    await expect(getSupabaseJwks()).resolves.toBeUndefined();
  });

  it('응답이 ok가 아니면 undefined를 반환한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        createResponse({ keys: sampleKeys }, false),
      ),
    );

    const getSupabaseJwks = await loadModule();

    await expect(getSupabaseJwks()).resolves.toBeUndefined();
  });

  it('JSON에 keys 배열이 없으면 undefined를 반환한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => createResponse({ keys: 'not-an-array' })),
    );

    const getSupabaseJwks = await loadModule();

    await expect(getSupabaseJwks()).resolves.toBeUndefined();
  });

  it('JSON 파싱이 실패하면 undefined를 반환하고 throw 하지 않는다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(
        async () =>
          ({
            ok: true,
            status: 200,
            json: async () => {
              throw new SyntaxError('invalid json');
            },
          }) as unknown as Response,
      ),
    );

    const getSupabaseJwks = await loadModule();

    await expect(getSupabaseJwks()).resolves.toBeUndefined();
  });

  it('실패 결과는 캐시하지 않고 다음 호출에서 다시 fetch 한다', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(createResponse({}, false))
      .mockResolvedValueOnce(createResponse({ keys: sampleKeys }));
    vi.stubGlobal('fetch', fetchMock);

    const getSupabaseJwks = await loadModule();

    await expect(getSupabaseJwks()).resolves.toBeUndefined();
    await expect(getSupabaseJwks()).resolves.toBeUndefined();
    await expect(getSupabaseJwks()).resolves.toEqual({ keys: sampleKeys });

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

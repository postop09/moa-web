// @vitest-environment node
import { inspect } from 'node:util';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { classifyWithJev } from './server';

const DEFAULT_URL = 'https://api.typesafe.ai/v1/systemone';
const API_KEY = 'test-jev-key';

const INSTRUCTIONS = '문의를 가장 알맞은 카테고리로 분류한다.';
const CRITERIA = {
  alpha: '알파 설명',
  beta: '베타 설명',
  gamma: '감마 설명',
};
const TEXT = '공유 가계부에 멤버를 초대하려는데 링크가 열리지 않아요';

const createResponse = (body: unknown, ok = true, status = 200) =>
  ({
    ok,
    status,
    json: async () => body,
  }) as unknown as Response;

const successBody = (category: unknown) => ({
  model: 'jev-latest',
  answers: { category },
  usage: {},
});

const validCategory = {
  type: 'choice',
  choice: 'alpha',
  confidence: 0.83,
  probabilities: { alpha: 0.83, beta: 0.1, gamma: 0.07 },
};

const mockFetch = (impl: typeof fetch) => {
  const fetchMock = vi.fn<typeof fetch>(impl);
  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

const mockOk = (category: unknown = validCategory) =>
  mockFetch(async () => createResponse(successBody(category)));

const getCall = (fetchMock: ReturnType<typeof mockFetch>) => {
  const [url, init] = fetchMock.mock.calls[0];
  const headers = new Headers(init?.headers);
  const body = JSON.parse(String(init?.body));

  return { url, init, headers, body };
};

const run = () =>
  classifyWithJev({
    text: TEXT,
    instructions: INSTRUCTIONS,
    criteria: CRITERIA,
  });

const dumpWarnArgs = (spy: ReturnType<typeof vi.spyOn>) =>
  inspect(spy.mock.calls, { depth: 6, maxStringLength: Infinity });

describe('classifyWithJev', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('JEV_API_KEY', API_KEY);
    vi.stubEnv('JEV_API_URL', '');
    vi.stubEnv('JEV_MODEL', '');
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  describe('요청 형태', () => {
    it('JEV_API_URL이 없으면 기본 URL로 POST 한다', async () => {
      const fetchMock = mockOk();

      await run();

      const { url, init } = getCall(fetchMock);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(String(url)).toBe(DEFAULT_URL);
      expect(init?.method).toBe('POST');
    });

    it('JEV_API_URL이 있으면 그 URL을 쓴다', async () => {
      vi.stubEnv('JEV_API_URL', 'https://jev.example.com/custom');
      const fetchMock = mockOk();

      await run();

      expect(String(getCall(fetchMock).url)).toBe(
        'https://jev.example.com/custom',
      );
    });

    it('Bearer 인증과 JSON Content-Type 헤더를 보낸다', async () => {
      const fetchMock = mockOk();

      await run();

      const { headers } = getCall(fetchMock);
      expect(headers.get('Authorization')).toBe(`Bearer ${API_KEY}`);
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('모델 기본값은 jev-latest', async () => {
      const fetchMock = mockOk();

      await run();

      expect(getCall(fetchMock).body.model).toBe('jev-latest');
    });

    it('JEV_MODEL로 모델을 바꿀 수 있다', async () => {
      vi.stubEnv('JEV_MODEL', 'jev-custom');
      const fetchMock = mockOk();

      await run();

      expect(getCall(fetchMock).body.model).toBe('jev-custom');
    });

    it('body.state는 입력 text이고 category choice 질문 하나만 보낸다', async () => {
      const fetchMock = mockOk();

      await run();

      const { body } = getCall(fetchMock);
      expect(body.state).toBe(TEXT);
      expect(Object.keys(body.questions)).toEqual(['category']);
      expect(body.questions.category).toEqual({
        type: 'choice',
        instructions: INSTRUCTIONS,
        criteria: CRITERIA,
      });
    });

    it('AbortSignal을 함께 전달한다', async () => {
      const fetchMock = mockOk();

      await run();

      expect(getCall(fetchMock).init?.signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe('성공', () => {
    it('answers.category의 choice와 confidence를 반환한다', async () => {
      mockOk();

      await expect(run()).resolves.toEqual({
        choice: 'alpha',
        confidence: 0.83,
      });
    });

    it.each([0, 1])('confidence 경계값 %i 도 유효하다', async (confidence) => {
      mockOk({ ...validCategory, confidence });

      await expect(run()).resolves.toEqual({ choice: 'alpha', confidence });
    });
  });

  describe('실패는 throw 없이 null', () => {
    it('JEV_API_KEY가 없으면 fetch 없이 null', async () => {
      vi.stubEnv('JEV_API_KEY', '');
      const fetchMock = mockOk();

      await expect(run()).resolves.toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fetch가 reject 되면 null', async () => {
      mockFetch(async () => {
        throw new Error('network down');
      });

      await expect(run()).resolves.toBeNull();
    });

    it.each([400, 401, 429, 500])('HTTP %i 응답이면 null', async (status) => {
      mockFetch(async () => createResponse({ error: 'x' }, false, status));

      await expect(run()).resolves.toBeNull();
    });

    it('응답 JSON 파싱이 실패하면 null', async () => {
      mockFetch(
        async () =>
          ({
            ok: true,
            status: 200,
            json: async () => {
              throw new SyntaxError('Unexpected token');
            },
          }) as unknown as Response,
      );

      await expect(run()).resolves.toBeNull();
    });

    it.each<[string, unknown]>([
      ['body가 null', null],
      ['answers 없음', { model: 'm' }],
      ['answers가 문자열', { answers: 'x' }],
      ['answers.category 없음', { answers: {} }],
      ['answers.category가 null', { answers: { category: null } }],
      ['answers.category가 문자열', { answers: { category: 'alpha' } }],
      ['choice가 문자열 아님', successBody({ ...validCategory, choice: 3 })],
      [
        'choice 없음',
        successBody({ type: 'choice', confidence: 0.9, probabilities: {} }),
      ],
      [
        'confidence가 숫자 아님',
        successBody({ ...validCategory, confidence: '0.9' }),
      ],
      [
        'confidence가 NaN',
        successBody({ ...validCategory, confidence: Number.NaN }),
      ],
      [
        'confidence 없음',
        successBody({ type: 'choice', choice: 'alpha', probabilities: {} }),
      ],
    ])('%s 이면 null', async (_label, body) => {
      mockFetch(async () => createResponse(body));

      await expect(run()).resolves.toBeNull();
    });
  });

  describe('타임아웃', () => {
    it('기본 3000ms 안에 응답이 없으면 null로 끝난다', async () => {
      vi.useFakeTimers();
      // signal이 abort 되면 reject 하는 hanging fetch
      mockFetch(
        (_url, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError')),
            );
          }),
      );

      let settled = false;
      const promise = run().then((result) => {
        settled = true;

        return result;
      });

      await vi.advanceTimersByTimeAsync(2900);
      expect(settled).toBe(false);

      await vi.advanceTimersByTimeAsync(200);
      await expect(promise).resolves.toBeNull();
    });
  });
  describe('confidence 범위 검증', () => {
    it.each([1.5, -0.1, 87, Number.POSITIVE_INFINITY])(
      'confidence %s 는 범위 밖이라 null',
      async (confidence) => {
        mockOk({ ...validCategory, confidence });

        await expect(run()).resolves.toBeNull();
      },
    );
  });

  describe('실패 로그 (console.warn)', () => {
    const SECRET_BODY = 'upstream-secret-body-xyz';

    const expectSafeSingleWarn = (reason: string) => {
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const dump = dumpWarnArgs(warnSpy);
      expect(dump).toContain('jev_classify_failed');
      expect(dump).toContain(reason);
      expect(dump).not.toContain(API_KEY);
      expect(dump).not.toContain(TEXT);
      expect(dump).not.toContain('typesafe.ai');
      expect(dump).not.toContain(SECRET_BODY);
    };

    it('성공하면 아무것도 로그하지 않는다', async () => {
      mockOk();

      await run();

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('키가 없으면 no_key 사유로 한 번 로그한다', async () => {
      vi.stubEnv('JEV_API_KEY', '');
      mockOk();

      await run();

      expectSafeSingleWarn('no_key');
    });

    it.each([400, 401, 429, 500])(
      'HTTP %i 는 상태 코드를 담아 한 번 로그하고 응답 본문은 남기지 않는다',
      async (status) => {
        mockFetch(async () =>
          createResponse({ error: SECRET_BODY }, false, status),
        );

        await run();

        expectSafeSingleWarn(String(status));
      },
    );

    it('네트워크 오류는 network 사유만 로그하고 오류 메시지(키/URL/본문)는 남기지 않는다', async () => {
      mockFetch(async () => {
        throw new TypeError(
          `fetch failed https://api.typesafe.ai/v1/systemone?key=${API_KEY} ${TEXT} ${SECRET_BODY}`,
        );
      });

      await run();

      expectSafeSingleWarn('network');
    });

    it('JSON 파싱 실패는 parse 사유로 로그한다', async () => {
      mockFetch(
        async () =>
          ({
            ok: true,
            status: 200,
            json: async () => {
              throw new SyntaxError(`Unexpected token ${SECRET_BODY}`);
            },
          }) as unknown as Response,
      );

      await run();

      expectSafeSingleWarn('parse');
    });

    it('응답 형식이 맞지 않으면 parse 사유로 로그한다', async () => {
      mockFetch(async () =>
        createResponse({ answers: { category: SECRET_BODY } }),
      );

      await run();

      expectSafeSingleWarn('parse');
    });

    it('타임아웃은 timeout 사유로 한 번 로그한다', async () => {
      vi.useFakeTimers();
      mockFetch(
        (_url, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError')),
            );
          }),
      );

      const promise = run();
      await vi.advanceTimersByTimeAsync(3100);
      await promise;

      expectSafeSingleWarn('timeout');
    });
  });
});

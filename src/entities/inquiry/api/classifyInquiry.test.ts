import { afterEach, describe, expect, it, vi } from 'vitest';

import { classifyInquiry } from './classifyInquiry';

const NULL_RESULT = { category: null, confidence: null };
const TEXT = '공유 가계부에 멤버를 초대하려는데 링크가 열리지 않아요';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const mockFetch = (
  impl: (...args: Parameters<typeof fetch>) => Promise<Response>,
) => {
  const fetchMock = vi.fn<typeof fetch>(impl);
  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

describe('classifyInquiry', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('/api/inquiries/classify 로 { text }를 JSON POST 한다', async () => {
    const fetchMock = mockFetch(async () =>
      jsonResponse({ category: 'bug_report', confidence: 0.8 }),
    );

    await classifyInquiry(TEXT);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/inquiries/classify');
    expect(init?.method).toBe('POST');
    expect(new Headers(init?.headers).get('Content-Type')).toBe(
      'application/json',
    );
    expect(JSON.parse(String(init?.body))).toEqual({ text: TEXT });
  });

  it('성공 응답의 category/confidence를 반환한다', async () => {
    mockFetch(async () =>
      jsonResponse({ category: 'bug_report', confidence: 0.8 }),
    );

    await expect(classifyInquiry(TEXT)).resolves.toEqual({
      category: 'bug_report',
      confidence: 0.8,
    });
  });

  it('서버가 null 결과를 주면 그대로 반환한다', async () => {
    mockFetch(async () => jsonResponse(NULL_RESULT));

    await expect(classifyInquiry(TEXT)).resolves.toEqual(NULL_RESULT);
  });

  it('signal을 fetch에 전달한다', async () => {
    const fetchMock = mockFetch(async () => jsonResponse(NULL_RESULT));
    const controller = new AbortController();

    await classifyInquiry(TEXT, controller.signal);

    expect(fetchMock.mock.calls[0][1]?.signal).toBe(controller.signal);
  });

  it('네트워크 에러면 null 결과로 resolve 한다', async () => {
    mockFetch(async () => {
      throw new TypeError('Failed to fetch');
    });

    await expect(classifyInquiry(TEXT)).resolves.toEqual(NULL_RESULT);
  });

  it.each([400, 401, 500])('HTTP %i 이면 null 결과', async (status) => {
    mockFetch(async () => jsonResponse({ error: 'x' }, status));

    await expect(classifyInquiry(TEXT)).resolves.toEqual(NULL_RESULT);
  });

  it('JSON 파싱 실패면 null 결과', async () => {
    mockFetch(async () => new Response('<html>oops</html>', { status: 200 }));

    await expect(classifyInquiry(TEXT)).resolves.toEqual(NULL_RESULT);
  });

  it('AbortError는 다시 던진다', async () => {
    mockFetch(async () => {
      throw new DOMException('aborted', 'AbortError');
    });

    await expect(classifyInquiry(TEXT)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});

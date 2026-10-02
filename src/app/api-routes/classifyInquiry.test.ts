// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  INQUIRY_BODY_MAX,
  INQUIRY_CATEGORIES,
  INQUIRY_TITLE_MAX,
} from '@/entities/inquiry';

import { classifyInquiryRoute } from './classifyInquiry';

const getUserMock = vi.fn();
const classifyWithJevMock = vi.fn();

vi.mock('@/shared/api/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
  })),
  classifyWithJev: (...args: unknown[]) => classifyWithJevMock(...args),
}));

const API_KEY = 'secret-jev-key-123';
const VALID_TEXT = '공유 가계부에 멤버를 초대하려는데 링크가 열리지 않아요';

// 클라이언트는 `${title}\n${body}` 를 보내므로 상한은 제목 + 개행 + 본문이다.
const TEXT_MAX = INQUIRY_TITLE_MAX + 1 + INQUIRY_BODY_MAX;
const MAX_REQUEST_BYTES = 16 * 1024;

const AUTHED = { data: { user: { id: 'user-1' } }, error: null };
const ANON = { data: { user: null }, error: null };

const createRequest = (
  body?: unknown,
  raw?: string,
  extraHeaders: Record<string, string> = {},
) =>
  new Request('https://moa.test/api/inquiries/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: raw ?? JSON.stringify(body),
  });

describe('classifyInquiryRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('JEV_API_KEY', API_KEY);
    getUserMock.mockResolvedValue(AUTHED);
    classifyWithJevMock.mockResolvedValue({
      choice: INQUIRY_CATEGORIES[0],
      confidence: 0.9,
    });
  });

  describe('인증', () => {
    it('세션이 없으면 401 JSON, classifyWithJev 미호출', async () => {
      getUserMock.mockResolvedValue(ANON);

      const response = await classifyInquiryRoute(
        createRequest({ text: VALID_TEXT }),
      );

      expect(response.status).toBe(401);
      expect(response.headers.get('Content-Type')).toMatch(/application\/json/);
      await expect(response.json()).resolves.toBeDefined();
      expect(classifyWithJevMock).not.toHaveBeenCalled();
    });

    it('getUser가 error를 돌려줘도 401', async () => {
      getUserMock.mockResolvedValue({
        data: { user: null },
        error: { message: 'bad jwt' },
      });

      const response = await classifyInquiryRoute(
        createRequest({ text: VALID_TEXT }),
      );

      expect(response.status).toBe(401);
      expect(classifyWithJevMock).not.toHaveBeenCalled();
    });
  });

  describe('입력 검증 (400)', () => {
    it.each<[string, () => Request]>([
      ['JSON이 아닌 body', () => createRequest(undefined, 'not json{')],
      ['text 누락', () => createRequest({})],
      ['text가 문자열 아님', () => createRequest({ text: 123 })],
      ['빈 text', () => createRequest({ text: '' })],
      ['공백뿐인 text', () => createRequest({ text: '          ' })],
      [
        'trim 후 10자 미만',
        () => createRequest({ text: `  ${'가'.repeat(9)}  ` }),
      ],
      [
        `${TEXT_MAX}자 초과`,
        () => createRequest({ text: 'a'.repeat(TEXT_MAX + 1) }),
      ],
    ])('%s 이면 400이고 분류를 호출하지 않는다', async (_label, make) => {
      const response = await classifyInquiryRoute(make());

      expect(response.status).toBe(400);
      expect(classifyWithJevMock).not.toHaveBeenCalled();
    });

    it('trim 후 정확히 10자는 허용한다', async () => {
      const response = await classifyInquiryRoute(
        createRequest({ text: `  ${'가'.repeat(10)}  ` }),
      );

      expect(response.status).toBe(200);
    });

    it(`정확히 ${TEXT_MAX}자(제목 + 개행 + 본문 최대)는 허용한다`, async () => {
      const response = await classifyInquiryRoute(
        createRequest({ text: 'a'.repeat(TEXT_MAX) }),
      );

      expect(response.status).toBe(200);
    });

    it('본문만 최대 길이 + 제목이 붙은 실제 전송 형태도 허용한다', async () => {
      const text = `${'제'.repeat(INQUIRY_TITLE_MAX)}\n${'본'.repeat(INQUIRY_BODY_MAX)}`;

      const response = await classifyInquiryRoute(createRequest({ text }));

      expect(response.status).toBe(200);
      expect(classifyWithJevMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('요청 크기 제한 (413)', () => {
    it('content-length 헤더가 16KB를 넘으면 413, 분류 미호출, no-store', async () => {
      const response = await classifyInquiryRoute(
        createRequest({ text: VALID_TEXT }, undefined, {
          'content-length': String(MAX_REQUEST_BYTES + 1),
        }),
      );

      expect(response.status).toBe(413);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      expect(classifyWithJevMock).not.toHaveBeenCalled();
    });

    it('content-length 가 정확히 16KB면 통과한다', async () => {
      const response = await classifyInquiryRoute(
        createRequest({ text: VALID_TEXT }, undefined, {
          'content-length': String(MAX_REQUEST_BYTES),
        }),
      );

      expect(response.status).toBe(200);
    });

    it('헤더 없이 body 스트림이 16KB를 넘어도 413, 분류 미호출, no-store', async () => {
      const raw = JSON.stringify({ text: 'a'.repeat(MAX_REQUEST_BYTES + 100) });
      const request = createRequest(undefined, raw);
      expect(request.headers.get('content-length')).toBeNull();

      const response = await classifyInquiryRoute(request);

      expect(response.status).toBe(413);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      expect(classifyWithJevMock).not.toHaveBeenCalled();
    });

    it('한글 등 멀티바이트로 바이트 수만 16KB를 넘는 body도 413', async () => {
      // 글자 수는 TEXT_MAX 이하여도 바이트가 크면 스트림 기준으로 막는다.
      const raw = JSON.stringify({
        text: '가'.repeat(100),
        padding: '나'.repeat(MAX_REQUEST_BYTES),
      });

      const response = await classifyInquiryRoute(
        createRequest(undefined, raw),
      );

      expect(response.status).toBe(413);
      expect(classifyWithJevMock).not.toHaveBeenCalled();
    });
  });

  describe('분류', () => {
    it('classifyWithJev + mapJevCategory 결과를 200으로 돌려준다', async () => {
      classifyWithJevMock.mockResolvedValue({
        choice: 'bug_report',
        confidence: 0.77,
      });

      const response = await classifyInquiryRoute(
        createRequest({ text: VALID_TEXT }),
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        category: 'bug_report',
        confidence: 0.77,
      });
    });

    it('classifyWithJev에 text와 instructions/criteria를 전달한다', async () => {
      await classifyInquiryRoute(createRequest({ text: `  ${VALID_TEXT}  ` }));

      expect(classifyWithJevMock).toHaveBeenCalledTimes(1);
      const arg = classifyWithJevMock.mock.calls[0][0];
      expect(arg.text.trim()).toBe(VALID_TEXT);
      expect(typeof arg.instructions).toBe('string');
      expect(Object.keys(arg.criteria).sort()).toEqual(
        [...INQUIRY_CATEGORIES].sort(),
      );
    });

    it('임계값 미만이면 category null, confidence 유지', async () => {
      classifyWithJevMock.mockResolvedValue({
        choice: 'bug_report',
        confidence: 0.2,
      });

      const response = await classifyInquiryRoute(
        createRequest({ text: VALID_TEXT }),
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        category: null,
        confidence: 0.2,
      });
    });

    it('classifyWithJev가 null이면 에러가 아니라 200 null 결과', async () => {
      classifyWithJevMock.mockResolvedValue(null);

      const response = await classifyInquiryRoute(
        createRequest({ text: VALID_TEXT }),
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        category: null,
        confidence: null,
      });
    });
  });

  describe('응답 보안', () => {
    it('Cache-Control: no-store 를 설정한다 (성공/실패 공통)', async () => {
      const ok = await classifyInquiryRoute(
        createRequest({ text: VALID_TEXT }),
      );
      const bad = await classifyInquiryRoute(createRequest({}));
      getUserMock.mockResolvedValue(ANON);
      const unauth = await classifyInquiryRoute(
        createRequest({ text: VALID_TEXT }),
      );

      [ok, bad, unauth].forEach((response) => {
        expect(response.headers.get('Cache-Control')).toBe('no-store');
      });
    });

    it('응답에 API 키와 입력 text가 포함되지 않는다', async () => {
      const responses = [
        await classifyInquiryRoute(createRequest({ text: VALID_TEXT })),
      ];
      classifyWithJevMock.mockResolvedValue(null);
      responses.push(
        await classifyInquiryRoute(createRequest({ text: VALID_TEXT })),
      );

      for (const response of responses) {
        const raw = await response.text();
        expect(raw).not.toContain(API_KEY);
        expect(raw).not.toContain(VALID_TEXT);
      }
    });
  });
});

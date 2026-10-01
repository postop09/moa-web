import { NextResponse } from 'next/server';

import {
  INQUIRY_BODY_MAX,
  INQUIRY_BODY_MIN,
  INQUIRY_TITLE_MAX,
  INQUIRY_CLASSIFY_CRITERIA,
  INQUIRY_CLASSIFY_INSTRUCTIONS,
  mapJevCategory,
} from '@/entities/inquiry';
import { classifyWithJev, createServerClient } from '@/shared/api/server';

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });

const MAX_REQUEST_BYTES = 16 * 1024;
// 클라이언트는 `${title}\n${body}` 를 보낸다.
const TEXT_MAX = INQUIRY_TITLE_MAX + 1 + INQUIRY_BODY_MAX;

class PayloadTooLargeError extends Error {}

const readLimitedBody = async (request: Request): Promise<string> => {
  const reader = request.body?.getReader();
  if (!reader) return '';

  const decoder = new TextDecoder();
  let received = 0;
  let result = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    received += value.byteLength;
    if (received > MAX_REQUEST_BYTES) {
      await reader.cancel().catch(() => {});
      throw new PayloadTooLargeError();
    }
    result += decoder.decode(value, { stream: true });
  }

  return result + decoder.decode();
};

const readText = async (request: Request): Promise<string | null> => {
  try {
    const body: unknown = JSON.parse(await readLimitedBody(request));
    if (typeof body !== 'object' || body === null) return null;

    const text = (body as { text?: unknown }).text;

    return typeof text === 'string' ? text : null;
  } catch (error) {
    if (error instanceof PayloadTooLargeError) throw error;

    return null;
  }
};

/** middleware matcher 가 /api 를 덮지 않으므로 핸들러가 직접 인증한다. */
export const classifyInquiryRoute = async (request: Request) => {
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return json({ error: 'unauthorized' }, 401);
  }

  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_REQUEST_BYTES) {
    return json({ error: 'payload_too_large' }, 413);
  }

  let raw: string | null;
  try {
    raw = await readText(request);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return json({ error: 'payload_too_large' }, 413);
    }
    throw error;
  }
  const text = raw?.trim() ?? '';
  const length = [...text].length;

  if (raw === null || length < INQUIRY_BODY_MIN || length > TEXT_MAX) {
    return json({ error: 'invalid_text' }, 400);
  }

  const result = await classifyWithJev({
    text,
    instructions: INQUIRY_CLASSIFY_INSTRUCTIONS,
    criteria: INQUIRY_CLASSIFY_CRITERIA,
  });

  return json(mapJevCategory(result));
};

const DEFAULT_URL = 'https://api.typesafe.ai/v1/systemone';
const DEFAULT_MODEL = 'jev-latest';
const TIMEOUT_MS = 3000;

type Params = {
  text: string;
  instructions: string;
  criteria: Record<string, string>;
};

type Result = { choice: string; confidence: number };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseResult = (body: unknown): Result | null => {
  if (!isRecord(body) || !isRecord(body.answers)) return null;

  const category = body.answers.category;
  if (!isRecord(category)) return null;

  const { choice, confidence } = category;
  if (
    typeof choice !== 'string' ||
    typeof confidence !== 'number' ||
    !Number.isFinite(confidence) ||
    confidence < 0 ||
    confidence > 1
  ) {
    return null;
  }

  return { choice, confidence };
};

const warnFailed = (reason: string) => {
  // 키·URL·입력 텍스트·응답 본문은 남기지 않고 사유 코드만 기록한다.
  console.warn('jev_classify_failed', reason);
};

/** 서버 전용. 실패·타임아웃·형식 오류는 throw 없이 null. */
export const classifyWithJev = async ({
  text,
  instructions,
  criteria,
}: Params): Promise<Result | null> => {
  const apiKey = process.env.JEV_API_KEY;
  if (!apiKey) {
    warnFailed('no_key');

    return null;
  }

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(process.env.JEV_API_URL || DEFAULT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        state: text,
        model: process.env.JEV_MODEL || DEFAULT_MODEL,
        questions: {
          category: { type: 'choice', instructions, criteria },
        },
      }),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      warnFailed(String(response.status));

      return null;
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      warnFailed(timedOut ? 'timeout' : 'parse');

      return null;
    }

    const result = parseResult(body);
    if (!result) warnFailed('parse');

    return result;
  } catch {
    warnFailed(timedOut ? 'timeout' : 'network');

    return null;
  } finally {
    clearTimeout(timer);
  }
};

import type { JWK } from '@supabase/supabase-js';

type Jwks = { keys: JWK[] };

const JWKS_TTL_MS = 10 * 60 * 1000;

// Supabase 클라이언트의 JWKS 캐시는 인스턴스 단위인데 proxy는 요청마다 새 인스턴스를
// 만들어 캐시가 매번 비므로, 모듈 레벨에서 직접 캐시한다.
let cached: { value: Jwks; fetchedAt: number } | undefined;
let inFlight: Promise<Jwks | undefined> | undefined;

const isJwks = (body: unknown): body is Jwks => {
  return (
    typeof body === 'object' &&
    body !== null &&
    Array.isArray((body as { keys?: unknown }).keys)
  );
};

const JWKS_FETCH_TIMEOUT_MS = 2000;

const fetchJwks = async (supabaseUrl: string): Promise<Jwks | undefined> => {
  try {
    // proxy가 매 요청 이 결과를 await하므로 응답이 매달리면 전체 요청이 멈춘다.
    const res = await fetch(`${supabaseUrl}/auth/v1/.well-known/jwks.json`, {
      signal: AbortSignal.timeout(JWKS_FETCH_TIMEOUT_MS),
    });

    if (!res.ok) {
      return undefined;
    }

    const body: unknown = await res.json();

    if (!isJwks(body)) {
      return undefined;
    }

    cached = { value: body, fetchedAt: Date.now() };

    return body;
  } catch {
    return undefined;
  }
};

export const getSupabaseJwks = async (): Promise<Jwks | undefined> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // URL이 없으면 "undefined/auth/..."로 매 요청 실패 fetch가 반복되므로 즉시 포기한다.
  if (!supabaseUrl) {
    return undefined;
  }

  if (cached && Date.now() - cached.fetchedAt < JWKS_TTL_MS) {
    return cached.value;
  }

  if (!inFlight) {
    inFlight = fetchJwks(supabaseUrl).finally(() => {
      inFlight = undefined;
    });
  }

  return inFlight;
};

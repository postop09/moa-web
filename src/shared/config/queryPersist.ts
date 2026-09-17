export const QUERY_PERSIST_KEY = 'moa:query-cache';
export const QUERY_PERSIST_MAX_AGE_MS = 24 * 60 * 60 * 1000;
// 캐시 데이터 형태가 바뀔 때만 수동으로 올린다(배포마다 비우지 않음).
export const QUERY_PERSIST_BUSTER = 'v1';

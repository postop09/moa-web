import {
  INQUIRY_BODY_MAX,
  INQUIRY_BODY_MIN,
  INQUIRY_TITLE_MAX,
  INQUIRY_TITLE_MIN,
} from '../config/limits';

type Params = {
  title: string;
  body: string;
  mode: 'new' | 'followUp';
};

type Result = {
  valid: boolean;
  errors: { title?: string; body?: string };
};

// DB의 btrim(x, E' \t\r\n')와 동일하게 공백/탭/CR/LF만 제거한다 (String.trim은 전각 공백·NBSP도 제거).
const TRIM_CHARS = new Set([' ', '\t', '\r', '\n']);

const dbTrim = (value: string): string => {
  let start = 0;
  let end = value.length;
  while (start < end && TRIM_CHARS.has(value[start])) start += 1;
  while (end > start && TRIM_CHARS.has(value[end - 1])) end -= 1;
  return value.slice(start, end);
};

// 코드포인트 단위로 센다 (DB char_length와 일치, 이모지 등 서로게이트 쌍을 1자로 계산)
const countChars = (value: string): number => [...dbTrim(value)].length;

export const validateInquiryForm = ({ title, body, mode }: Params): Result => {
  const errors: Result['errors'] = {};
  const t = countChars(title);
  const b = countChars(body);

  if (mode === 'new' && (t < INQUIRY_TITLE_MIN || t > INQUIRY_TITLE_MAX)) {
    errors.title = `제목을 ${INQUIRY_TITLE_MIN}자 이상 ${INQUIRY_TITLE_MAX}자 이하로 적어주세요.`;
  }
  if (b < INQUIRY_BODY_MIN) {
    errors.body = `내용을 ${INQUIRY_BODY_MIN}자 이상 적어주세요.`;
  } else if (b > INQUIRY_BODY_MAX) {
    errors.body = `내용은 ${INQUIRY_BODY_MAX}자 이하로 적어주세요.`;
  }

  return { valid: Object.keys(errors).length === 0, errors };
};

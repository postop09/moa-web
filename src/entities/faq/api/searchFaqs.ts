import type { SupabaseClient } from '@/shared/api';

import { FAQ_SEARCH_MIN_LENGTH } from '../config/limits';
import { FAQ_TABLE } from '../config/tableName';
import type { Faq } from '../model/faq';

// or() 필터 문자열 안에서 사용자 입력을 안전하게 다루기 위한 이스케이프:
// 1) LIKE 메타문자(\ % _)는 백슬래시로 이스케이프해 리터럴로 검색한다.
// 2) PostgREST는 like/ilike 값의 `*`를 `%` 별칭으로 바꾸므로, 와일드카드로 해석되지 않게
//    `_`(한 글자 와일드카드)로 치환한다. `*` 자체를 리터럴로 보낼 방법이 없어 근사 매칭이다.
// 3) 값을 큰따옴표로 감싸므로 쉼표·괄호는 이스케이프하지 않는다. 따옴표 문자열 안에서는
//    백슬래시와 큰따옴표만 이스케이프하면 된다.
const escapeLike = (value: string) =>
  value.replace(/[\\%_]/g, (c) => `\\${c}`).replace(/\*/g, '_');

const escapeQuoted = (value: string) =>
  value.replace(/[\\"]/g, (c) => `\\${c}`);

export const searchFaqs = async (
  supabase: SupabaseClient,
  keyword: string,
): Promise<Faq[]> => {
  const trimmed = keyword.trim();
  if (trimmed.length < FAQ_SEARCH_MIN_LENGTH) return [];

  const pattern = escapeQuoted(`%${escapeLike(trimmed)}%`);
  const { data, error } = await supabase
    .from(FAQ_TABLE)
    .select('*')
    .or(`question.ilike."${pattern}",answer.ilike."${pattern}"`)
    .order('sortOrder', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
};

import { isUuid } from '@/shared/lib';

export type WriteMode =
  | { mode: 'new' }
  | { mode: 'followUp'; inquiryId: string }
  | { mode: 'edit'; inquiryId: string };

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/** ?followUp=<id> / ?edit=<id>. uuid 형식이 아니거나 둘 다 없으면 새 문의로 취급한다. */
export const parseWriteMode = (searchParams: SearchParams): WriteMode => {
  const followUp = first(searchParams.followUp);
  if (isUuid(followUp)) return { mode: 'followUp', inquiryId: followUp };

  const edit = first(searchParams.edit);
  if (isUuid(edit)) return { mode: 'edit', inquiryId: edit };

  return { mode: 'new' };
};

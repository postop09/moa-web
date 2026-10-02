import { describe, expect, it, vi } from 'vitest';

import { getAdminInquiryMessages } from './getAdminInquiryMessages';

const createSupabase = (result: { data: unknown; error: unknown }) => {
  const rpc = vi.fn(async () => result);

  return { supabase: { rpc } as never, rpc };
};

const ROWS = [
  {
    id: 'm1',
    inquiryId: 'inq-1',
    kind: 'question',
    authorId: 'user-1',
    authorEmail: 'user@moa.test',
    body: '문의 내용',
    attachments: ['user-1/f/a.jpg'],
    createdAt: '2026-10-01T00:12:00Z',
  },
  {
    id: 'm2',
    inquiryId: 'inq-1',
    kind: 'memo',
    authorId: 'op-1',
    authorEmail: 'opa@moa.test',
    body: '내부 메모',
    attachments: [],
    createdAt: '2026-10-01T01:00:00Z',
  },
];

describe('getAdminInquiryMessages', () => {
  it('admin_get_inquiry_messages RPC 를 p_inquiry_id 로 호출한다', async () => {
    const { supabase, rpc } = createSupabase({ data: ROWS, error: null });

    await getAdminInquiryMessages(supabase, 'inq-1');

    expect(rpc).toHaveBeenCalledWith('admin_get_inquiry_messages', {
      p_inquiry_id: 'inq-1',
    });
  });

  it('메모를 포함한 행을 순서와 camelCase 키 그대로 돌려준다', async () => {
    const { supabase } = createSupabase({ data: ROWS, error: null });

    await expect(getAdminInquiryMessages(supabase, 'inq-1')).resolves.toEqual(
      ROWS,
    );
  });

  it('data 가 null 이면 빈 배열', async () => {
    const { supabase } = createSupabase({ data: null, error: null });

    await expect(getAdminInquiryMessages(supabase, 'inq-1')).resolves.toEqual(
      [],
    );
  });

  it('RPC 에러는 그대로 던진다', async () => {
    const error = { code: 'P0001', message: 'forbidden' };
    const { supabase } = createSupabase({ data: null, error });

    await expect(getAdminInquiryMessages(supabase, 'inq-1')).rejects.toBe(
      error,
    );
  });
});

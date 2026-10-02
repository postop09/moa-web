import { describe, expect, it, vi } from 'vitest';

import { addAdminMemo } from './addAdminMemo';

const createSupabase = (result: { data: unknown; error: unknown }) => {
  const rpc = vi.fn(async () => result);

  return { supabase: { rpc } as never, rpc };
};

describe('addAdminMemo', () => {
  it('admin_add_memo RPC 를 p_inquiry_id, p_body 로 호출한다', async () => {
    const { supabase, rpc } = createSupabase({ data: 'memo-id', error: null });

    await addAdminMemo(supabase, {
      inquiryId: 'inq-1',
      body: '로그 확인 요청',
    });

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('admin_add_memo', {
      p_inquiry_id: 'inq-1',
      p_body: '로그 확인 요청',
    });
  });

  it('새 메모 id(문자열)를 돌려준다', async () => {
    const { supabase } = createSupabase({ data: 'memo-id', error: null });

    await expect(
      addAdminMemo(supabase, { inquiryId: 'inq-1', body: '메모' }),
    ).resolves.toBe('memo-id');
  });

  it('RPC 에러는 그대로 던진다', async () => {
    const error = { code: 'P0001', message: 'invalid_body' };
    const { supabase } = createSupabase({ data: null, error });

    await expect(
      addAdminMemo(supabase, { inquiryId: 'inq-1', body: '' }),
    ).rejects.toBe(error);
  });
});

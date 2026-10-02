import { describe, expect, it, vi } from 'vitest';

import { closeAdminInquiry } from './closeAdminInquiry';

const createSupabase = (result: { data: unknown; error: unknown }) => {
  const rpc = vi.fn(async () => result);

  return { supabase: { rpc } as never, rpc };
};

describe('closeAdminInquiry', () => {
  it('admin_close_inquiry RPC 를 p_inquiry_id, p_reason 으로 호출한다', async () => {
    const { supabase, rpc } = createSupabase({ data: null, error: null });

    await expect(
      closeAdminInquiry(supabase, { inquiryId: 'inq-1', reason: '중복 문의' }),
    ).resolves.toBeUndefined();

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('admin_close_inquiry', {
      p_inquiry_id: 'inq-1',
      p_reason: '중복 문의',
    });
  });

  it('RPC 에러는 그대로 던진다', async () => {
    const error = { code: 'P0001', message: 'invalid_state' };
    const { supabase } = createSupabase({ data: null, error });

    await expect(
      closeAdminInquiry(supabase, { inquiryId: 'inq-1', reason: '테스트' }),
    ).rejects.toBe(error);
  });
});

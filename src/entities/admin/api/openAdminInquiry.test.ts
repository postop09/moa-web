import { describe, expect, it, vi } from 'vitest';

import { openAdminInquiry } from './openAdminInquiry';

const createSupabase = (result: { data: unknown; error: unknown }) => {
  const rpc = vi.fn(async () => result);

  return { supabase: { rpc } as never, rpc };
};

describe('openAdminInquiry', () => {
  it('admin_open_inquiry RPC 를 p_inquiry_id 로 호출하고 아무 값도 돌려주지 않는다', async () => {
    const { supabase, rpc } = createSupabase({ data: null, error: null });

    await expect(openAdminInquiry(supabase, 'inq-1')).resolves.toBeUndefined();

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('admin_open_inquiry', {
      p_inquiry_id: 'inq-1',
    });
  });

  it('RPC 에러는 그대로 던진다', async () => {
    const error = { code: 'P0001', message: 'not_found' };
    const { supabase } = createSupabase({ data: null, error });

    await expect(openAdminInquiry(supabase, 'inq-1')).rejects.toBe(error);
  });
});

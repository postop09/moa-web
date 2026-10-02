import { describe, expect, it, vi } from 'vitest';

import { getAdminPendingCount } from './getAdminPendingCount';

const createSupabase = (result: { data: unknown; error: unknown }) => {
  const rpc = vi.fn(async () => result);

  return { supabase: { rpc } as never, rpc };
};

describe('getAdminPendingCount', () => {
  it('admin_pending_inquiry_count RPC 를 인자 없이 호출해 숫자를 돌려준다', async () => {
    const { supabase, rpc } = createSupabase({ data: 12, error: null });

    await expect(getAdminPendingCount(supabase)).resolves.toBe(12);
    expect(rpc).toHaveBeenCalledWith('admin_pending_inquiry_count');
  });

  it('bigint 가 문자열로 와도 숫자로 바꾼다', async () => {
    const { supabase } = createSupabase({ data: '7', error: null });

    await expect(getAdminPendingCount(supabase)).resolves.toBe(7);
  });

  it('데이터가 null 이면 0', async () => {
    const { supabase } = createSupabase({ data: null, error: null });

    await expect(getAdminPendingCount(supabase)).resolves.toBe(0);
  });

  it('RPC 에러는 그대로 던진다', async () => {
    const error = { code: 'P0001', message: 'unauthorized' };
    const { supabase } = createSupabase({ data: null, error });

    await expect(getAdminPendingCount(supabase)).rejects.toBe(error);
  });
});

import { describe, expect, it, vi } from 'vitest';

import { getAdminList } from './getAdminList';

const createSupabase = (result: { data: unknown; error: unknown }) => {
  const rpc = vi.fn(async () => result);

  return { supabase: { rpc } as never, rpc };
};

describe('getAdminList', () => {
  it('admin_list_admins RPC 를 인자 없이 호출한다', async () => {
    const { supabase, rpc } = createSupabase({ data: [], error: null });

    await getAdminList(supabase);

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('admin_list_admins');
  });

  it('{ userId, email } 행을 그대로 돌려준다', async () => {
    const rows = [
      { userId: 'op-1', email: 'opa@moa.test' },
      { userId: 'op-2', email: 'opb@moa.test' },
    ];
    const { supabase } = createSupabase({ data: rows, error: null });

    await expect(getAdminList(supabase)).resolves.toEqual(rows);
  });

  it('data 가 null 이면 빈 배열', async () => {
    const { supabase } = createSupabase({ data: null, error: null });

    await expect(getAdminList(supabase)).resolves.toEqual([]);
  });

  it('RPC 에러는 그대로 던진다', async () => {
    const error = { code: 'P0001', message: 'forbidden' };
    const { supabase } = createSupabase({ data: null, error });

    await expect(getAdminList(supabase)).rejects.toBe(error);
  });
});

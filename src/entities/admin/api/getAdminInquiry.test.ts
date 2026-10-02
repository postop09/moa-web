import { describe, expect, it, vi } from 'vitest';

import { getAdminInquiry } from './getAdminInquiry';

const createSupabase = (result: { data: unknown; error: unknown }) => {
  const rpc = vi.fn(async () => result);

  return { supabase: { rpc } as never, rpc };
};

const ROW = {
  id: 'inq-1',
  userId: 'user-1',
  title: '동기화 후 내역이 사라졌어요',
  status: 'waiting',
  category: null,
  categoryConfidence: null,
  deviceInfo: null,
  assigneeId: null,
  assigneeEmail: null,
  hasUnreadReply: false,
  rating: null,
  closeReason: null,
  waitingSince: '2026-10-01T00:12:00Z',
  createdAt: '2026-10-01T00:12:00Z',
  updatedAt: '2026-10-01T00:12:00Z',
};

describe('getAdminInquiry', () => {
  it('admin_get_inquiry RPC 를 p_inquiry_id 로 호출한다', async () => {
    const { supabase, rpc } = createSupabase({ data: [ROW], error: null });

    await getAdminInquiry(supabase, 'inq-1');

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('admin_get_inquiry', {
      p_inquiry_id: 'inq-1',
    });
  });

  it('TABLE 반환(배열)의 첫 행을 camelCase 키 그대로 돌려준다', async () => {
    const { supabase } = createSupabase({ data: [ROW], error: null });

    await expect(getAdminInquiry(supabase, 'inq-1')).resolves.toEqual(ROW);
  });

  it.each([[[]], [null]])(
    '행이 %j 이면 not_found 로 던진다 (null 을 돌려주지 않는다)',
    async (data) => {
      const { supabase } = createSupabase({ data, error: null });

      await expect(getAdminInquiry(supabase, 'inq-1')).rejects.toMatchObject({
        message: expect.stringContaining('not_found'),
      });
    },
  );

  it('RPC 에러(not_found 포함)는 가공하지 않고 그대로 던진다', async () => {
    const error = { code: 'P0001', message: 'not_found' };
    const { supabase } = createSupabase({ data: null, error });

    await expect(getAdminInquiry(supabase, 'inq-1')).rejects.toBe(error);
  });
});

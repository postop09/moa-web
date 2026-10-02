import { describe, expect, it, vi } from 'vitest';

import { getAdminUserRecentInquiries } from './getAdminUserRecentInquiries';

const createSupabase = (result: { data: unknown; error: unknown }) => {
  const rpc = vi.fn(async () => result);

  return { supabase: { rpc } as never, rpc };
};

describe('getAdminUserRecentInquiries', () => {
  it('limit 을 생략하면 p_limit 은 5 로 보낸다', async () => {
    const { supabase, rpc } = createSupabase({ data: [], error: null });

    await getAdminUserRecentInquiries(supabase, { inquiryId: 'inq-1' });

    expect(rpc).toHaveBeenCalledWith('admin_user_recent_inquiries', {
      p_inquiry_id: 'inq-1',
      p_limit: 5,
    });
  });

  it('limit 을 주면 p_limit 으로 전달한다', async () => {
    const { supabase, rpc } = createSupabase({ data: [], error: null });

    await getAdminUserRecentInquiries(supabase, {
      inquiryId: 'inq-1',
      limit: 3,
    });

    expect(rpc).toHaveBeenCalledWith('admin_user_recent_inquiries', {
      p_inquiry_id: 'inq-1',
      p_limit: 3,
    });
  });

  it('행을 camelCase 키 그대로 돌려주고 null 이면 빈 배열', async () => {
    const rows = [
      {
        id: 'a',
        title: '이전 문의',
        status: 'closed',
        category: 'bug_report',
        createdAt: '2026-08-13T15:00:00Z',
      },
    ];

    await expect(
      getAdminUserRecentInquiries(
        createSupabase({ data: rows, error: null }).supabase,
        { inquiryId: 'inq-1' },
      ),
    ).resolves.toEqual(rows);
    await expect(
      getAdminUserRecentInquiries(
        createSupabase({ data: null, error: null }).supabase,
        { inquiryId: 'inq-1' },
      ),
    ).resolves.toEqual([]);
  });

  it('RPC 에러는 그대로 던진다', async () => {
    const error = { code: 'P0001', message: 'not_found' };
    const { supabase } = createSupabase({ data: null, error });

    await expect(
      getAdminUserRecentInquiries(supabase, { inquiryId: 'inq-1' }),
    ).rejects.toBe(error);
  });
});

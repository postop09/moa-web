import { describe, expect, it, vi } from 'vitest';

import { updateAdminInquiryMeta } from './updateAdminInquiryMeta';

const createSupabase = (result: { data: unknown; error: unknown }) => {
  const rpc = vi.fn(async () => result);

  return { supabase: { rpc } as never, rpc };
};

describe('updateAdminInquiryMeta', () => {
  it('생략한 항목(undefined)은 "변경 없음" 인 null 로 보낸다', async () => {
    const { supabase, rpc } = createSupabase({ data: null, error: null });

    await updateAdminInquiryMeta(supabase, {
      inquiryId: 'inq-1',
      status: 'waiting',
    });

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('admin_update_inquiry_meta', {
      p_inquiry_id: 'inq-1',
      p_status: 'waiting',
      p_assignee_id: null,
      p_category: null,
    });
  });

  it('담당자만 바꾸면 p_assignee_id 만 값이 있다', async () => {
    const { supabase, rpc } = createSupabase({ data: null, error: null });

    await updateAdminInquiryMeta(supabase, {
      inquiryId: 'inq-1',
      assigneeId: 'op-2',
    });

    expect(rpc).toHaveBeenCalledWith('admin_update_inquiry_meta', {
      p_inquiry_id: 'inq-1',
      p_status: null,
      p_assignee_id: 'op-2',
      p_category: null,
    });
  });

  it('카테고리만 바꾸면 p_category 만 값이 있다', async () => {
    const { supabase, rpc } = createSupabase({ data: null, error: null });

    await updateAdminInquiryMeta(supabase, {
      inquiryId: 'inq-1',
      category: 'bug_report',
    });

    expect(rpc).toHaveBeenCalledWith('admin_update_inquiry_meta', {
      p_inquiry_id: 'inq-1',
      p_status: null,
      p_assignee_id: null,
      p_category: 'bug_report',
    });
  });

  it('여러 항목을 한 번에 보낼 수 있고 아무 값도 돌려주지 않는다', async () => {
    const { supabase, rpc } = createSupabase({ data: null, error: null });

    await expect(
      updateAdminInquiryMeta(supabase, {
        inquiryId: 'inq-1',
        status: 'in_progress',
        assigneeId: 'op-1',
        category: 'other',
      }),
    ).resolves.toBeUndefined();

    expect(rpc).toHaveBeenCalledWith('admin_update_inquiry_meta', {
      p_inquiry_id: 'inq-1',
      p_status: 'in_progress',
      p_assignee_id: 'op-1',
      p_category: 'other',
    });
  });

  it('RPC 에러는 그대로 던진다', async () => {
    const error = { code: 'P0001', message: 'invalid_state' };
    const { supabase } = createSupabase({ data: null, error });

    await expect(
      updateAdminInquiryMeta(supabase, {
        inquiryId: 'inq-1',
        status: 'waiting',
      }),
    ).rejects.toBe(error);
  });
});

import { describe, expect, it, vi } from 'vitest';

import { replyAdminInquiry } from './replyAdminInquiry';

const createSupabase = (result: { data: unknown; error: unknown }) => {
  const rpc = vi.fn(async () => result);

  return { supabase: { rpc } as never, rpc };
};

const PAYLOAD = {
  inquiryId: 'inq-1',
  body: '설정에서 동기화를 눌러주세요.',
  attachments: ['user-1/folder/a.jpg', 'user-1/folder/b.png'],
  expectedLastMessageId: 'm1',
  expectedUpdatedAt: '2026-10-01T05:20:00Z',
};

describe('replyAdminInquiry', () => {
  it('payload 를 admin_reply_inquiry RPC 파라미터로 그대로 옮긴다', async () => {
    const { supabase, rpc } = createSupabase({ data: 'new-id', error: null });

    await replyAdminInquiry(supabase, PAYLOAD);

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('admin_reply_inquiry', {
      p_inquiry_id: 'inq-1',
      p_body: '설정에서 동기화를 눌러주세요.',
      p_attachments: ['user-1/folder/a.jpg', 'user-1/folder/b.png'],
      p_expected_last_message_id: 'm1',
      p_expected_updated_at: '2026-10-01T05:20:00Z',
    });
  });

  it('새 메시지 id(문자열)를 돌려준다', async () => {
    const { supabase } = createSupabase({ data: 'new-id', error: null });

    await expect(replyAdminInquiry(supabase, PAYLOAD)).resolves.toBe('new-id');
  });

  it('첨부가 없으면 빈 배열을 보낸다 (null 이 아니다)', async () => {
    const { supabase, rpc } = createSupabase({ data: 'new-id', error: null });

    await replyAdminInquiry(supabase, { ...PAYLOAD, attachments: [] });

    expect(rpc).toHaveBeenCalledWith(
      'admin_reply_inquiry',
      expect.objectContaining({ p_attachments: [] }),
    );
  });

  it.each(['conflict', 'uncategorized', 'invalid_state', 'invalid_body'])(
    '%s 에러는 가공하지 않고 그대로 던진다',
    async (message) => {
      const error = { code: 'P0001', message };
      const { supabase } = createSupabase({ data: null, error });

      await expect(replyAdminInquiry(supabase, PAYLOAD)).rejects.toBe(error);
    },
  );
});

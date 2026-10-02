import { describe, expect, it, vi } from 'vitest';

import { parseAdminInquiryFilters } from '../lib/parseAdminInquiryFilters';
import type { AdminInquiryFilters } from '../model/adminInquiryFilters';

import { getAdminInquiries } from './getAdminInquiries';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-10-02T00:00:00Z');

const defaults = (overrides: Partial<AdminInquiryFilters> = {}) => ({
  ...parseAdminInquiryFilters({}),
  ...overrides,
});

const createSupabase = (result: { data: unknown; error: unknown }) => {
  const rpc = vi.fn(async () => result);

  return { supabase: { rpc } as never, rpc };
};

const row = (id: string, totalCount: number) => ({
  id,
  title: `제목 ${id}`,
  status: 'waiting',
  category: null,
  categoryConfidence: null,
  waitingSince: '2026-10-01T00:00:00Z',
  createdAt: '2026-10-01T00:00:00Z',
  assigneeId: null,
  assigneeEmail: null,
  totalCount,
});

describe('getAdminInquiries', () => {
  it('기본 필터를 admin_list_inquiries RPC 파라미터로 그대로 옮긴다', async () => {
    const { supabase, rpc } = createSupabase({ data: [], error: null });

    await getAdminInquiries(supabase, defaults(), NOW);

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('admin_list_inquiries', {
      p_statuses: ['waiting', 'in_progress'],
      p_category: null,
      p_uncategorized_only: false,
      // 기본 상태(대기·처리 중)의 기본 기간은 전체라 p_since 가 없다.
      p_since: null,
      p_keyword: null,
      p_sort: 'waiting',
      p_sort_dir: 'asc',
      p_limit: 20,
      p_offset: 0,
    });
  });

  it.each([7, 30, 90] as const)(
    'periodDays %i 는 now 에서 그만큼 뺀 시각을 p_since 로 보낸다',
    async (periodDays) => {
      const { supabase, rpc } = createSupabase({ data: [], error: null });

      await getAdminInquiries(supabase, defaults({ periodDays }), NOW);

      expect(rpc).toHaveBeenCalledWith(
        'admin_list_inquiries',
        expect.objectContaining({
          p_since: new Date(NOW - periodDays * DAY_MS).toISOString(),
        }),
      );
    },
  );

  it('periodDays 가 null(전체)이면 p_since 는 null', async () => {
    const { supabase, rpc } = createSupabase({ data: [], error: null });

    await getAdminInquiries(supabase, defaults({ periodDays: null }), NOW);

    expect(rpc).toHaveBeenCalledWith(
      'admin_list_inquiries',
      expect.objectContaining({ p_since: null }),
    );
  });

  it('카테고리, 미분류만, 정렬, 상태 선택을 그대로 전달한다', async () => {
    const { supabase, rpc } = createSupabase({ data: [], error: null });

    await getAdminInquiries(
      supabase,
      defaults({
        statuses: ['answered', 'closed'],
        category: 'bug_report',
        uncategorizedOnly: true,
        sort: 'confidence',
        sortDir: 'desc',
      }),
      NOW,
    );

    expect(rpc).toHaveBeenCalledWith(
      'admin_list_inquiries',
      expect.objectContaining({
        p_statuses: ['answered', 'closed'],
        p_category: 'bug_report',
        p_uncategorized_only: true,
        p_sort: 'confidence',
        p_sort_dir: 'desc',
      }),
    );
  });

  describe('키워드', () => {
    it('앞뒤 공백을 제거해 2자 이상이면 보낸다', async () => {
      const { supabase, rpc } = createSupabase({ data: [], error: null });

      await getAdminInquiries(supabase, defaults({ keyword: '  결제  ' }), NOW);

      expect(rpc).toHaveBeenCalledWith(
        'admin_list_inquiries',
        expect.objectContaining({ p_keyword: '결제' }),
      );
    });

    it.each(['', ' ', '결', '  결  '])(
      '%j 는 trim 후 2자 미만이라 null 로 보낸다',
      async (keyword) => {
        const { supabase, rpc } = createSupabase({ data: [], error: null });

        await getAdminInquiries(supabase, defaults({ keyword }), NOW);

        expect(rpc).toHaveBeenCalledWith(
          'admin_list_inquiries',
          expect.objectContaining({ p_keyword: null }),
        );
      },
    );
  });

  describe('페이지', () => {
    it.each([
      [1, 20, 0],
      [2, 20, 20],
      [3, 50, 100],
      [2, 100, 100],
    ])(
      'page %i, pageSize %i 는 limit=%2$i, offset=%i',
      async (page, pageSize, offset) => {
        const { supabase, rpc } = createSupabase({ data: [], error: null });

        await getAdminInquiries(
          supabase,
          defaults({ page, pageSize: pageSize as 20 | 50 | 100 }),
          NOW,
        );

        expect(rpc).toHaveBeenCalledWith(
          'admin_list_inquiries',
          expect.objectContaining({ p_limit: pageSize, p_offset: offset }),
        );
      },
    );
  });

  describe('결과', () => {
    it('items 는 행 목록이고 total 은 첫 행의 totalCount 다', async () => {
      const { supabase } = createSupabase({
        data: [row('a', 45), row('b', 45)],
        error: null,
      });

      const result = await getAdminInquiries(supabase, defaults(), NOW);

      expect(result.total).toBe(45);
      expect(result.items.map((item) => item.id)).toEqual(['a', 'b']);
      expect(result.items[0]).toMatchObject({
        title: '제목 a',
        categoryConfidence: null,
        assigneeEmail: null,
      });
    });

    it('목록 항목에는 totalCount 를 남기지 않는다', async () => {
      const { supabase } = createSupabase({
        data: [row('a', 1)],
        error: null,
      });

      const result = await getAdminInquiries(supabase, defaults(), NOW);

      expect(result.items[0]).not.toHaveProperty('totalCount');
    });

    it.each([[[]], [null]])('행이 %j 이면 빈 목록과 total 0', async (data) => {
      const { supabase } = createSupabase({ data, error: null });

      await expect(
        getAdminInquiries(supabase, defaults(), NOW),
      ).resolves.toEqual({ items: [], total: 0 });
    });
  });

  it('RPC 에러는 가공하지 않고 그대로 던진다', async () => {
    const error = { code: 'P0001', message: 'forbidden' };
    const { supabase } = createSupabase({ data: null, error });

    await expect(getAdminInquiries(supabase, defaults(), NOW)).rejects.toBe(
      error,
    );
  });

  it('now 를 생략하면 현재 시각을 기준으로 p_since 를 계산한다', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    try {
      const { supabase, rpc } = createSupabase({ data: [], error: null });

      await getAdminInquiries(supabase, defaults({ periodDays: 7 }));

      expect(rpc).toHaveBeenCalledWith(
        'admin_list_inquiries',
        expect.objectContaining({
          p_since: new Date(NOW - 7 * DAY_MS).toISOString(),
        }),
      );
    } finally {
      vi.useRealTimers();
    }
  });
});

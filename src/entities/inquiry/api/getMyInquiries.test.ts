import { describe, expect, it, vi } from 'vitest';

import { getMyInquiries } from './getMyInquiries';

const createBuilder = (rows: unknown[] = []) => {
  const calls: [string, unknown[]][] = [];
  const builder: Record<string, unknown> = {};
  const record =
    (name: string, terminal = false) =>
    (...args: unknown[]) => {
      calls.push([name, args]);

      return terminal ? Promise.resolve({ data: rows, error: null }) : builder;
    };

  builder.select = record('select');
  builder.eq = record('eq');
  builder.in = record('in');
  builder.order = record('order');
  builder.range = record('range', true);

  const supabase = { from: vi.fn(() => builder) };

  return { supabase, calls };
};

const orders = (calls: [string, unknown[]][]) =>
  calls.filter(([name]) => name === 'order').map(([, args]) => args);

describe('getMyInquiries', () => {
  it('정렬은 미확인 우선, 최신순, 그리고 안정적인 동률 처리용 id 내림차순 순서로 건다', async () => {
    const { supabase, calls } = createBuilder();

    await getMyInquiries(supabase as never, { userId: 'user-1', page: 0 });

    expect(orders(calls)).toEqual([
      ['hasUnreadReply', { ascending: false }],
      ['createdAt', { ascending: false }],
      ['id', { ascending: false }],
    ]);
  });

  it('range 호출 전에 모든 정렬이 적용된다', async () => {
    const { supabase, calls } = createBuilder();

    await getMyInquiries(supabase as never, { userId: 'user-1', page: 0 });

    const names = calls.map(([name]) => name);
    expect(names.lastIndexOf('order')).toBeLessThan(names.indexOf('range'));
  });
});

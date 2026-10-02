import { describe, expect, it } from 'vitest';

import {
  parseAdminInquiryFilters,
  serializeAdminInquiryFilters,
} from './parseAdminInquiryFilters';

const DEFAULTS = {
  statuses: ['waiting', 'in_progress'],
  category: null,
  uncategorizedOnly: false,
  periodDays: null,
  keyword: '',
  sort: 'waiting',
  sortDir: 'asc',
  page: 1,
  pageSize: 20,
};

describe('parseAdminInquiryFilters', () => {
  it('쿼리가 비어 있으면 기본값 (답변 대기+처리 중, 전체 기간, 오래 기다린 순, 1페이지, 20개)', () => {
    expect(parseAdminInquiryFilters({})).toEqual(DEFAULTS);
  });

  describe('status', () => {
    it('쉼표로 구분한 여러 상태를 읽는다', () => {
      expect(
        parseAdminInquiryFilters({ status: 'waiting,in_progress,answered' })
          .statuses,
      ).toEqual(['waiting', 'in_progress', 'answered']);
    });

    it('순서는 waiting, in_progress, answered, closed 로 정규화하고 중복을 없앤다', () => {
      expect(
        parseAdminInquiryFilters({ status: 'closed,waiting,closed' }).statuses,
      ).toEqual(['waiting', 'closed']);
    });

    it('알 수 없는 값은 버리고, 남는 게 없으면 기본값', () => {
      expect(
        parseAdminInquiryFilters({ status: 'answered,bogus' }).statuses,
      ).toEqual(['answered']);
      expect(parseAdminInquiryFilters({ status: 'bogus' }).statuses).toEqual(
        DEFAULTS.statuses,
      );
      expect(parseAdminInquiryFilters({ status: '' }).statuses).toEqual(
        DEFAULTS.statuses,
      );
    });
  });

  describe('category / uncategorized', () => {
    it('유효한 카테고리만 받는다', () => {
      expect(
        parseAdminInquiryFilters({ category: 'bug_report' }).category,
      ).toBe('bug_report');
      expect(
        parseAdminInquiryFilters({ category: 'nope' }).category,
      ).toBeNull();
    });

    it('uncategorized=1 일 때만 true', () => {
      expect(
        parseAdminInquiryFilters({ uncategorized: '1' }).uncategorizedOnly,
      ).toBe(true);
      expect(
        parseAdminInquiryFilters({ uncategorized: '0' }).uncategorizedOnly,
      ).toBe(false);
      expect(
        parseAdminInquiryFilters({ uncategorized: 'true' }).uncategorizedOnly,
      ).toBe(false);
    });
  });

  describe('period', () => {
    it.each([
      ['7', 7],
      ['30', 30],
      ['90', 90],
      ['all', null],
    ])('period=%s -> %s', (value, expected) => {
      expect(parseAdminInquiryFilters({ period: value }).periodDays).toBe(
        expected,
      );
    });

    it.each(['1', '365', 'week', ''])(
      'period=%j 는 알 수 없는 값이라 없는 것과 같다 (기본 상태면 전체)',
      (value) => {
        expect(
          parseAdminInquiryFilters({ period: value }).periodDays,
        ).toBeNull();
        expect(
          parseAdminInquiryFilters({ period: value, status: 'answered' })
            .periodDays,
        ).toBe(30);
      },
    );

    describe('period 가 없을 때의 기본값은 상태에 따라 다르다', () => {
      it.each([
        ['waiting', null],
        ['in_progress', null],
        ['waiting,in_progress', null],
        ['answered', 30],
        ['closed', 30],
        ['answered,closed', 30],
        ['waiting,answered', 30],
        ['in_progress,closed', 30],
        ['waiting,in_progress,answered,closed', 30],
      ])('status=%s -> %s', (status, expected) => {
        expect(parseAdminInquiryFilters({ status }).periodDays).toBe(expected);
      });

      it('status 도 없으면(기본 상태) 전체', () => {
        expect(parseAdminInquiryFilters({}).periodDays).toBeNull();
      });

      it('유효한 상태가 하나도 없어 기본 상태로 돌아가면 전체', () => {
        expect(
          parseAdminInquiryFilters({ status: 'bogus' }).periodDays,
        ).toBeNull();
      });
    });

    describe('명시한 period 는 상태와 무관하게 항상 이긴다', () => {
      it.each([
        ['waiting', '7', 7],
        ['waiting', '30', 30],
        ['waiting', '90', 90],
        ['waiting,in_progress', 'all', null],
        ['answered', '7', 7],
        ['answered', 'all', null],
        ['closed', '90', 90],
        ['waiting,closed', 'all', null],
      ])('status=%s period=%s -> %s', (status, period, expected) => {
        expect(parseAdminInquiryFilters({ status, period }).periodDays).toBe(
          expected,
        );
      });
    });
  });

  describe('q (키워드)', () => {
    it('앞뒤 공백을 제거한다', () => {
      expect(parseAdminInquiryFilters({ q: '  결제 ' }).keyword).toBe('결제');
    });

    it('없으면 빈 문자열', () => {
      expect(parseAdminInquiryFilters({}).keyword).toBe('');
    });
  });

  describe('sort / dir', () => {
    it('sort 는 waiting, confidence, createdAt 만 허용한다', () => {
      expect(parseAdminInquiryFilters({ sort: 'confidence' }).sort).toBe(
        'confidence',
      );
      expect(parseAdminInquiryFilters({ sort: 'createdAt' }).sort).toBe(
        'createdAt',
      );
      expect(parseAdminInquiryFilters({ sort: 'title' }).sort).toBe('waiting');
    });

    it('dir 는 asc, desc 만 허용하고 기본은 asc', () => {
      expect(parseAdminInquiryFilters({ dir: 'desc' }).sortDir).toBe('desc');
      expect(parseAdminInquiryFilters({ dir: 'up' }).sortDir).toBe('asc');
    });
  });

  describe('page / size', () => {
    it('page 는 1 이상의 정수만 받는다', () => {
      expect(parseAdminInquiryFilters({ page: '3' }).page).toBe(3);
      for (const bad of ['0', '-1', '1.5', 'abc', '']) {
        expect(parseAdminInquiryFilters({ page: bad }).page).toBe(1);
      }
    });

    it.each(['20', '50', '100'])('size=%s 허용', (value) => {
      expect(parseAdminInquiryFilters({ size: value }).pageSize).toBe(
        Number(value),
      );
    });

    it.each(['10', '30', 'abc', ''])('size=%j 는 기본 20', (value) => {
      expect(parseAdminInquiryFilters({ size: value }).pageSize).toBe(20);
    });
  });

  it('배열 값은 첫 번째 값을 쓴다', () => {
    expect(
      parseAdminInquiryFilters({
        category: ['bug_report', 'other'],
        page: ['2', '5'],
        status: ['answered', 'closed'],
      }),
    ).toMatchObject({
      category: 'bug_report',
      page: 2,
      statuses: ['answered'],
    });
  });

  it('undefined 값과 빈 배열은 없는 것으로 본다', () => {
    expect(parseAdminInquiryFilters({ category: undefined, page: [] })).toEqual(
      DEFAULTS,
    );
  });
});

describe('serializeAdminInquiryFilters', () => {
  const toRecord = (query: string) =>
    Object.fromEntries(new URLSearchParams(query));

  it('기본 필터는 빈 문자열로 직렬화한다 (기본값은 생략)', () => {
    expect(serializeAdminInquiryFilters(parseAdminInquiryFilters({}))).toBe('');
  });

  it('기본값과 다른 항목만 담는다', () => {
    const filters = {
      ...parseAdminInquiryFilters({}),
      uncategorizedOnly: true,
    };

    expect(toRecord(serializeAdminInquiryFilters(filters))).toEqual({
      uncategorized: '1',
    });
  });

  it('기본 상태에서 기간을 전체로 두면 period 는 생략하고, 페이지 크기는 size 로 담는다', () => {
    const filters = {
      ...parseAdminInquiryFilters({}),
      periodDays: null,
      pageSize: 50 as const,
    };
    const record = toRecord(serializeAdminInquiryFilters(filters));

    expect(record).not.toHaveProperty('period');
    expect(record.size).toBe('50');
  });

  describe('period 는 상태로 정해지는 기본값과 다를 때만 담는다', () => {
    const withState = (
      statuses: ('waiting' | 'in_progress' | 'answered' | 'closed')[],
      periodDays: 7 | 30 | 90 | null,
    ) => ({
      ...parseAdminInquiryFilters({}),
      statuses,
      periodDays,
    });

    it.each([
      [['waiting'], null, undefined],
      [['waiting', 'in_progress'], null, undefined],
      [['waiting', 'in_progress'], 30, '30'],
      [['in_progress'], 7, '7'],
      [['waiting'], 90, '90'],
      [['answered'], 30, undefined],
      [['answered', 'closed'], 30, undefined],
      [['waiting', 'answered'], 30, undefined],
      [['answered'], null, 'all'],
      [['waiting', 'closed'], null, 'all'],
      [['answered'], 7, '7'],
    ] as const)('statuses=%j periodDays=%s -> period=%s', (s, days, param) => {
      const record = toRecord(
        serializeAdminInquiryFilters(withState([...s], days)),
      );

      expect(record.period).toBe(param);
    });
  });

  it('상태는 쉼표로 이어 status 에 담는다', () => {
    const filters = {
      ...parseAdminInquiryFilters({}),
      statuses: ['answered', 'closed'] as ('answered' | 'closed')[],
    };

    expect(toRecord(serializeAdminInquiryFilters(filters)).status).toBe(
      'answered,closed',
    );
  });

  it('모든 항목을 바꿔도 parse(serialize(x)) 가 x 와 같다 (왕복)', () => {
    const filters = {
      statuses: ['waiting', 'answered', 'closed'] as (
        'waiting' | 'answered' | 'closed'
      )[],
      category: 'shared_household' as const,
      uncategorizedOnly: false,
      periodDays: 90 as const,
      keyword: '결제 오류&환불=?',
      sort: 'confidence' as const,
      sortDir: 'desc' as const,
      page: 4,
      pageSize: 100 as const,
    };

    const query = serializeAdminInquiryFilters(filters);

    expect(parseAdminInquiryFilters(toRecord(query))).toEqual(filters);
  });

  it('periodDays null, 미분류만도 왕복한다', () => {
    const filters = {
      ...parseAdminInquiryFilters({}),
      periodDays: null,
      uncategorizedOnly: true,
    };

    expect(
      parseAdminInquiryFilters(toRecord(serializeAdminInquiryFilters(filters))),
    ).toEqual(filters);
  });

  describe('기간과 상태 조합의 왕복', () => {
    const statusSets = [
      ['waiting'],
      ['waiting', 'in_progress'],
      ['answered'],
      ['closed'],
      ['waiting', 'answered'],
      ['waiting', 'in_progress', 'answered', 'closed'],
    ] as const;
    const periods = [7, 30, 90, null] as const;

    it.each(
      statusSets.flatMap((statuses) =>
        periods.map((periodDays) => [statuses, periodDays] as const),
      ),
    )('statuses=%j periodDays=%s', (statuses, periodDays) => {
      const filters = {
        ...parseAdminInquiryFilters({}),
        statuses: [...statuses],
        periodDays,
      };

      expect(
        parseAdminInquiryFilters(
          toRecord(serializeAdminInquiryFilters(filters)),
        ),
      ).toEqual(filters);
    });

    it('전체(null) 기간의 대기 전용 필터에 답변 완료를 더해도 전체를 유지한다 (period=all 을 내보낸다)', () => {
      const openOnly = parseAdminInquiryFilters({});
      const widened = {
        ...openOnly,
        statuses: ['waiting', 'in_progress', 'answered'] as (
          'waiting' | 'in_progress' | 'answered'
        )[],
      };
      const record = toRecord(serializeAdminInquiryFilters(widened));

      expect(record.period).toBe('all');
      expect(parseAdminInquiryFilters(record).periodDays).toBeNull();
    });

    it('30일 기간의 종결 전용 필터에서 대기만 남기면 30일을 유지한다 (period=30 을 내보낸다)', () => {
      const closed = parseAdminInquiryFilters({ status: 'closed' });
      const narrowed = { ...closed, statuses: ['waiting' as const] };
      const record = toRecord(serializeAdminInquiryFilters(narrowed));

      expect(record.period).toBe('30');
      expect(parseAdminInquiryFilters(record).periodDays).toBe(30);
    });
  });
});

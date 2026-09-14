import { describe, expect, it } from 'vitest';

import { resolveEffectiveHouseholdId } from './resolveEffectiveHouseholdId';

describe('resolveEffectiveHouseholdId', () => {
  it('households가 빈 배열이면 null을 반환한다', () => {
    expect(resolveEffectiveHouseholdId(null, [])).toBeNull();
    expect(resolveEffectiveHouseholdId('household-1', [])).toBeNull();
  });

  it('storedId가 households에 존재하면 storedId를 그대로 반환한다', () => {
    const households = [{ id: 'household-1' }, { id: 'household-2' }];

    expect(resolveEffectiveHouseholdId('household-2', households)).toBe(
      'household-2',
    );
  });

  it('storedId가 null이면 households의 첫 항목을 반환한다', () => {
    const households = [{ id: 'household-1' }, { id: 'household-2' }];

    expect(resolveEffectiveHouseholdId(null, households)).toBe('household-1');
  });

  it('storedId가 households에 없으면 households의 첫 항목을 반환한다', () => {
    const households = [{ id: 'household-1' }, { id: 'household-2' }];

    expect(resolveEffectiveHouseholdId('household-999', households)).toBe(
      'household-1',
    );
  });

  it('households가 1개뿐이고 storedId가 null이면 그 항목을 반환한다', () => {
    expect(resolveEffectiveHouseholdId(null, [{ id: 'only-household' }])).toBe(
      'only-household',
    );
  });

  it('households가 1개뿐이고 storedId가 일치하면 storedId를 반환한다', () => {
    expect(
      resolveEffectiveHouseholdId('only-household', [{ id: 'only-household' }]),
    ).toBe('only-household');
  });

  it('households가 1개뿐이고 storedId가 불일치하면 그 유일한 항목을 반환한다', () => {
    expect(
      resolveEffectiveHouseholdId('other-id', [{ id: 'only-household' }]),
    ).toBe('only-household');
  });
});

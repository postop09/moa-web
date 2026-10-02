import { afterEach, describe, expect, it, vi } from 'vitest';

const loadProductionRules = async () => {
  vi.resetModules();
  vi.stubEnv('VERCEL_ENV', 'production');

  const { default: robots } = await import('./robots');
  const { rules } = robots();

  return Array.isArray(rules) ? rules[0] : rules;
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('robots', () => {
  it('프로덕션에서 어드민과 고객센터 경로는 크롤링을 막는다', async () => {
    const rule = await loadProductionRules();
    const disallow = ([] as string[]).concat(rule.disallow ?? []);

    expect(disallow).toEqual(expect.arrayContaining(['/admin', '/support']));
  });
});

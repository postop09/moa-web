import { describe, it, expect } from 'vitest';
import { parseDeviceInfo, withDeviceExtras } from './collectDeviceInfo';

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const IPAD_UA =
  'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
const ANDROID_NO_MODEL_UA =
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
const MAC_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const WIN_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const parse = (userAgent: string) =>
  parseDeviceInfo({ userAgent, language: 'ko-KR', appVersion: '1.2.3' });

describe('parseDeviceInfo', () => {
  it('iPhone Safari', () => {
    expect(parse(IPHONE_UA)).toEqual({
      appVersion: '1.2.3',
      os: 'iOS 17.5',
      device: 'iPhone',
      language: 'ko-KR',
    });
  });

  it('iPad', () => {
    const r = parse(IPAD_UA);
    expect(r.os).toBe('iOS 16.6');
    expect(r.device).toBe('iPad');
  });

  it('Android Chrome은 UA의 모델 토큰을 기기로 쓴다', () => {
    expect(parse(ANDROID_UA)).toEqual({
      appVersion: '1.2.3',
      os: 'Android 14',
      device: 'SM-S918N',
      language: 'ko-KR',
    });
  });

  it('Android UA에 모델이 없으면 "Android"', () => {
    const r = parse(ANDROID_NO_MODEL_UA);
    expect(r.os).toBe('Android 14');
    expect(r.device).toBe('Android');
  });

  it('macOS 데스크톱', () => {
    const r = parse(MAC_UA);
    expect(r.os).toBe('macOS');
    expect(r.device).toBe('Desktop');
  });

  it('Windows 데스크톱', () => {
    const r = parse(WIN_UA);
    expect(r.os).toBe('Windows');
    expect(r.device).toBe('Desktop');
  });

  it('알 수 없는 UA는 os "unknown"', () => {
    expect(parse('').os).toBe('unknown');
    expect(parse('SomeCustomAgent/1.0').os).toBe('unknown');
  });

  it('appVersion, language는 입력값을 그대로 전달한다', () => {
    const r = parseDeviceInfo({
      userAgent: MAC_UA,
      language: 'en-US',
      appVersion: '9.9.9',
    });
    expect(r.appVersion).toBe('9.9.9');
    expect(r.language).toBe('en-US');
  });

  it.each([
    ['iPhone', IPHONE_UA],
    ['Android', ANDROID_UA],
    ['Mac', MAC_UA],
    ['Win', WIN_UA],
    ['unknown', ''],
  ])('%s: 정확히 4개 키만 반환한다 (개인정보 최소 수집)', (_n, ua) => {
    expect(Object.keys(parse(ua)).sort()).toEqual([
      'appVersion',
      'device',
      'language',
      'os',
    ]);
  });

  it('원본 userAgent 문자열을 결과에 포함하지 않는다', () => {
    expect(JSON.stringify(parse(IPHONE_UA))).not.toContain('Mozilla');
  });
});

describe('parseDeviceInfo (iPadOS / reduced UA)', () => {
  const IPADOS_MAC_UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';
  const REDUCED_ANDROID_UA =
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';

  const parseWith = (userAgent: string, maxTouchPoints?: number) =>
    parseDeviceInfo({
      userAgent,
      language: 'ko-KR',
      appVersion: '1.2.3',
      maxTouchPoints,
    });

  it('Macintosh UA + maxTouchPoints 5 -> iPadOS / iPad', () => {
    const r = parseWith(IPADOS_MAC_UA, 5);
    expect(r.os).toBe('iPadOS');
    expect(r.device).toBe('iPad');
  });

  it('Macintosh UA + maxTouchPoints 0 -> macOS / Desktop', () => {
    const r = parseWith(IPADOS_MAC_UA, 0);
    expect(r.os).toBe('macOS');
    expect(r.device).toBe('Desktop');
  });

  it('Macintosh UA + maxTouchPoints 미지정 -> macOS / Desktop', () => {
    const r = parseWith(IPADOS_MAC_UA, undefined);
    expect(r.os).toBe('macOS');
    expect(r.device).toBe('Desktop');
  });

  it('iPadOS 판별 시에도 4개 키만 반환한다', () => {
    expect(Object.keys(parseWith(IPADOS_MAC_UA, 5)).sort()).toEqual([
      'appVersion',
      'device',
      'language',
      'os',
    ]);
  });

  it('reduced UA의 한 글자 모델 토큰("K")은 모델 없음 -> device "Android", os "Android 10"', () => {
    const r = parseWith(REDUCED_ANDROID_UA);
    expect(r.device).toBe('Android');
    expect(r.os).toBe('Android 10');
  });
});

describe('withDeviceExtras', () => {
  const base = parse(IPHONE_UA);

  it('제공된 extras만 info에 합친다', () => {
    expect(
      withDeviceExtras(base, {
        errorCode: 'E42',
        entryScreen: '/inquiry',
        lastSyncedAt: '2026-10-01T00:00:00Z',
      }),
    ).toEqual({
      ...base,
      errorCode: 'E42',
      entryScreen: '/inquiry',
      lastSyncedAt: '2026-10-01T00:00:00Z',
    });
  });

  it('undefined인 extras는 키 자체를 만들지 않는다', () => {
    const r = withDeviceExtras(base, {
      errorCode: undefined,
      entryScreen: '/home',
    });
    expect(Object.keys(r).sort()).toEqual(
      [...Object.keys(base), 'entryScreen'].sort(),
    );
    expect('errorCode' in r).toBe(false);
  });

  it('extras가 비어 있으면 info와 동일한 키만 갖는다', () => {
    expect(withDeviceExtras(base, {})).toEqual(base);
    expect(Object.keys(withDeviceExtras(base, {})).sort()).toEqual(
      Object.keys(base).sort(),
    );
  });

  it('원본 info를 변경하지 않는다', () => {
    const copy = { ...base };
    withDeviceExtras(base, { errorCode: 'E1' });
    expect(base).toEqual(copy);
  });
});

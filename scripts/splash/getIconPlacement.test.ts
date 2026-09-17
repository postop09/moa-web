import { describe, expect, it } from 'vitest';

import { getIconPlacement } from './getIconPlacement';

// 스플래시 PNG 구성: 배경 위 중앙, 아이콘은 짧은 변의 30% 크기이되 512px 상한.
// 원본 icon-512.png를 512px 넘게 확대하면 흐려지므로 상한을 둔다.
// size = min(round(min(w, h) * 0.3), 512)
// left = round((w - size) / 2), top = round((h - size) / 2)
describe('getIconPlacement', () => {
  it('세로 iPhone 1170×2532: 짧은 변(1170)의 30% 크기로 중앙에 배치한다', () => {
    // size = round(1170 * 0.3) = 351 (512 이하라 상한 미적용)
    // left = round((1170 - 351) / 2) = round(409.5) = 410
    // top  = round((2532 - 351) / 2) = round(1090.5) = 1091
    expect(getIconPlacement({ width: 1170, height: 2532 })).toEqual({
      size: 351,
      left: 410,
      top: 1091,
    });
  });

  it('세로 iPad 2064×2752: 30%(619)가 512를 넘으므로 512로 제한한다', () => {
    // round(2064 * 0.3) = round(619.2) = 619 → min(619, 512) = 512
    // left = round((2064 - 512) / 2) = 776
    // top  = round((2752 - 512) / 2) = 1120
    expect(getIconPlacement({ width: 2064, height: 2752 })).toEqual({
      size: 512,
      left: 776,
      top: 1120,
    });
  });

  it('세로 iPad 2048×2732: 30%(614)가 512를 넘으므로 512로 제한한다', () => {
    // round(2048 * 0.3) = round(614.4) = 614 → min(614, 512) = 512
    // left = round((2048 - 512) / 2) = 768
    // top  = round((2732 - 512) / 2) = 1110
    expect(getIconPlacement({ width: 2048, height: 2732 })).toEqual({
      size: 512,
      left: 768,
      top: 1110,
    });
  });

  it('작은 캔버스 750×1334: 상한 없이 짧은 변의 30%를 그대로 쓴다', () => {
    // size = round(750 * 0.3) = 225
    // left = round((750 - 225) / 2) = round(262.5) = 263
    // top  = round((1334 - 225) / 2) = round(554.5) = 555
    expect(getIconPlacement({ width: 750, height: 1334 })).toEqual({
      size: 225,
      left: 263,
      top: 555,
    });
  });

  it('상한 경계: 짧은 변 1700은 510(상한 미만), 1720은 512로 잘린다', () => {
    // round(1700 * 0.3) = 510 → 상한 미적용, left = round((1700 - 510) / 2) = 595
    expect(getIconPlacement({ width: 1700, height: 3000 })).toEqual({
      size: 510,
      left: 595,
      top: 1245,
    });
    // round(1720 * 0.3) = 516 → min(516, 512) = 512, left = round((1720 - 512) / 2) = 604
    expect(getIconPlacement({ width: 1720, height: 3000 })).toEqual({
      size: 512,
      left: 604,
      top: 1244,
    });
  });

  it('정방형 100×100: 30% 크기로 정확히 중앙에 배치한다', () => {
    // size = round(100 * 0.3) = 30, left = top = (100 - 30) / 2 = 35
    expect(getIconPlacement({ width: 100, height: 100 })).toEqual({
      size: 30,
      left: 35,
      top: 35,
    });
  });

  it('가로 방향 입력도 짧은 변(height)을 기준으로 크기를 정한다', () => {
    // size = round(100 * 0.3) = 30, left = (300 - 30) / 2 = 135, top = (100 - 30) / 2 = 35
    expect(getIconPlacement({ width: 300, height: 100 })).toEqual({
      size: 30,
      left: 135,
      top: 35,
    });
  });

  it('홀수 짧은 변(101)은 Math.round 규칙으로 정수 좌표를 만든다', () => {
    // size = round(101 * 0.3) = round(30.3) = 30
    // left = round((101 - 30) / 2) = round(35.5) = 36
    // top  = round((200 - 30) / 2) = 85
    expect(getIconPlacement({ width: 101, height: 200 })).toEqual({
      size: 30,
      left: 36,
      top: 85,
    });
  });

  it('크기가 .5로 끝나면 Math.round 규칙대로 올림한다', () => {
    // size = round(105 * 0.3) = round(31.5) = 32
    // left = round((105 - 32) / 2) = round(36.5) = 37
    // top  = round((200 - 32) / 2) = 84
    expect(getIconPlacement({ width: 105, height: 200 })).toEqual({
      size: 32,
      left: 37,
      top: 84,
    });
  });

  it('어떤 캔버스에서도 아이콘 크기가 512를 넘지 않는다 (원본 아이콘 확대 방지)', () => {
    const specs = [
      { width: 2064, height: 2752 },
      { width: 2048, height: 2732 },
      { width: 1668, height: 2420 },
      { width: 1320, height: 2868 },
      { width: 750, height: 1334 },
    ];
    for (const spec of specs) {
      expect(
        getIconPlacement(spec).size,
        `${spec.width}x${spec.height}`,
      ).toBeLessThanOrEqual(512);
    }
  });

  it('반환값은 모두 정수다 (sharp composite는 정수 좌표만 받는다)', () => {
    const specs = [
      { width: 1170, height: 2532 },
      { width: 1125, height: 2436 },
      { width: 1179, height: 2556 },
      { width: 1488, height: 2266 },
      { width: 1640, height: 2360 },
    ];
    for (const spec of specs) {
      const { size, left, top } = getIconPlacement(spec);
      expect(Number.isInteger(size)).toBe(true);
      expect(Number.isInteger(left)).toBe(true);
      expect(Number.isInteger(top)).toBe(true);
    }
  });

  it('아이콘이 캔버스 안에 완전히 들어간다', () => {
    const specs = [
      { width: 750, height: 1334 },
      { width: 1320, height: 2868 },
      { width: 2048, height: 2732 },
      { width: 2064, height: 2752 },
      { width: 1668, height: 2224 },
    ];
    for (const spec of specs) {
      const { size, left, top } = getIconPlacement(spec);
      expect(left).toBeGreaterThanOrEqual(0);
      expect(top).toBeGreaterThanOrEqual(0);
      expect(left + size).toBeLessThanOrEqual(spec.width);
      expect(top + size).toBeLessThanOrEqual(spec.height);
    }
  });
});

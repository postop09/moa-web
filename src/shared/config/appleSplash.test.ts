import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  APPLE_SPLASH_SPECS,
  getAppleSplashStartupImages,
  getAppleSplashUrl,
  type AppleSplashSpec,
} from './appleSplash';

// 기존 app/layout.tsx에 하드코딩돼 있던 5개 iPhone 해상도.
// 단일 소스로 옮기면서 기존 기기가 빠지지 않도록 회귀를 막는다.
const LEGACY_RESOLUTIONS: ReadonlyArray<[width: number, height: number]> = [
  [1290, 2796],
  [1284, 2778],
  [1179, 2556],
  [1170, 2532],
  [1125, 2436],
];

const findSpec = (width: number, height: number) =>
  APPLE_SPLASH_SPECS.find(
    (spec) => spec.width === width && spec.height === height,
  );

// 이 테스트 파일은 src/shared/config/ 에 있으므로 세 단계 올라가면 저장소 루트다.
const SPLASH_DIR = path.resolve(import.meta.dirname, '../../../public/splash');

const toSplashFileName = (width: number, height: number) =>
  `apple-splash-${width}-${height}.png`;

describe('APPLE_SPLASH_SPECS', () => {
  it('iPhone 12개 + iPad 9개, 총 21개 스펙을 가진다', () => {
    expect(APPLE_SPLASH_SPECS).toHaveLength(21);
  });

  it('(width, height) 조합이 중복되지 않는다', () => {
    const keys = APPLE_SPLASH_SPECS.map(
      (spec) => `${spec.width}x${spec.height}`,
    );
    expect(new Set(keys).size).toBe(APPLE_SPLASH_SPECS.length);
  });

  it('모든 스펙에서 픽셀 크기 = 기기 크기 × 배율 관계가 성립한다', () => {
    for (const spec of APPLE_SPLASH_SPECS) {
      expect(spec.width, `${spec.width}x${spec.height} width`).toBe(
        spec.deviceWidth * spec.ratio,
      );
      expect(spec.height, `${spec.width}x${spec.height} height`).toBe(
        spec.deviceHeight * spec.ratio,
      );
    }
  });

  it('배율은 2 또는 3만 허용한다', () => {
    for (const spec of APPLE_SPLASH_SPECS) {
      expect([2, 3]).toContain(spec.ratio);
    }
  });

  it('모든 스펙이 세로 방향(height > width)이다', () => {
    for (const spec of APPLE_SPLASH_SPECS) {
      expect(spec.height, `${spec.width}x${spec.height}`).toBeGreaterThan(
        spec.width,
      );
    }
  });

  it.each(LEGACY_RESOLUTIONS)(
    '기존에 지원하던 %ix%i 해상도가 포함된다',
    (width, height) => {
      expect(findSpec(width, height)).toBeDefined();
    },
  );

  it('신규 iPad 3종(2064×2752, 1668×2420, 1668×2224)이 포함된다', () => {
    // iPad Pro 13" M4
    expect(findSpec(2064, 2752)).toMatchObject({
      deviceWidth: 1032,
      deviceHeight: 1376,
      ratio: 2,
    });
    // iPad Pro 11" M4
    expect(findSpec(1668, 2420)).toMatchObject({
      deviceWidth: 834,
      deviceHeight: 1210,
      ratio: 2,
    });
    // iPad Pro 10.5" / iPad Air 3
    expect(findSpec(1668, 2224)).toMatchObject({
      deviceWidth: 834,
      deviceHeight: 1112,
      ratio: 2,
    });
  });

  it('iPhone 스펙은 신형→구형 순으로 정렬돼 있다', () => {
    const iphoneOrder = APPLE_SPLASH_SPECS.slice(0, 12).map(
      (spec) => `${spec.width}x${spec.height}`,
    );

    expect(iphoneOrder).toEqual([
      '1320x2868',
      '1290x2796',
      '1260x2736',
      '1206x2622',
      '1179x2556',
      '1284x2778',
      '1170x2532',
      '1242x2688',
      '1125x2436',
      '828x1792',
      '1242x2208',
      '750x1334',
    ]);
  });
});

describe('스플래시 PNG 파일', () => {
  it.each(APPLE_SPLASH_SPECS.map((spec) => [spec.width, spec.height] as const))(
    '%ix%i 스펙에 대응하는 PNG가 public/splash에 존재한다',
    (width, height) => {
      expect(
        existsSync(path.join(SPLASH_DIR, toSplashFileName(width, height))),
      ).toBe(true);
    },
  );

  it('public/splash에 스펙에 없는 apple-splash-*.png가 남아 있지 않다', () => {
    const actual = readdirSync(SPLASH_DIR)
      .filter(
        (file) => file.startsWith('apple-splash-') && file.endsWith('.png'),
      )
      .sort();
    const expected = APPLE_SPLASH_SPECS.map((spec) =>
      toSplashFileName(spec.width, spec.height),
    ).sort();

    expect(actual).toEqual(expected);
  });
});

describe('getAppleSplashUrl', () => {
  it('/splash/apple-splash-{width}-{height}.png 형식의 URL을 반환한다', () => {
    const spec: AppleSplashSpec = {
      width: 1170,
      height: 2532,
      deviceWidth: 390,
      deviceHeight: 844,
      ratio: 3,
    };
    expect(getAppleSplashUrl(spec)).toBe('/splash/apple-splash-1170-2532.png');
  });

  it('iPad 스펙도 같은 형식을 따른다', () => {
    const spec: AppleSplashSpec = {
      width: 2048,
      height: 2732,
      deviceWidth: 1024,
      deviceHeight: 1366,
      ratio: 2,
    };
    expect(getAppleSplashUrl(spec)).toBe('/splash/apple-splash-2048-2732.png');
  });
});

describe('getAppleSplashStartupImages', () => {
  it('스펙 수와 같은 개수의 { url, media } 항목을 반환한다', () => {
    const images = getAppleSplashStartupImages();
    expect(images).toHaveLength(APPLE_SPLASH_SPECS.length);
    for (const image of images) {
      expect(Object.keys(image).sort()).toEqual(['media', 'url']);
      expect(typeof image.url).toBe('string');
      expect(typeof image.media).toBe('string');
    }
  });

  it('1170×2532 스펙은 정확한 url과 media 쿼리를 가진다', () => {
    const images = getAppleSplashStartupImages();
    const target = images.find(
      (image) => image.url === '/splash/apple-splash-1170-2532.png',
    );

    expect(target).toEqual({
      url: '/splash/apple-splash-1170-2532.png',
      media:
        '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
    });
  });

  it('iPad 2048×2732 스펙은 배율 2로 media 쿼리를 만든다', () => {
    const images = getAppleSplashStartupImages();
    const target = images.find(
      (image) => image.url === '/splash/apple-splash-2048-2732.png',
    );

    expect(target).toEqual({
      url: '/splash/apple-splash-2048-2732.png',
      media:
        '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
    });
  });

  it('모든 항목의 url이 각 스펙의 getAppleSplashUrl 결과와 순서대로 일치한다', () => {
    const images = getAppleSplashStartupImages();
    expect(images.map((image) => image.url)).toEqual(
      APPLE_SPLASH_SPECS.map((spec) => getAppleSplashUrl(spec)),
    );
  });

  it('media 쿼리가 중복되지 않는다 (iOS가 한 기기에 두 이미지를 매칭하지 않도록)', () => {
    const medias = getAppleSplashStartupImages().map((image) => image.media);
    expect(new Set(medias).size).toBe(medias.length);
  });

  it('모든 항목이 세로 방향(orientation: portrait) 조건을 가진다', () => {
    for (const image of getAppleSplashStartupImages()) {
      expect(image.media).toContain('(orientation: portrait)');
      expect(image.media).not.toContain('landscape');
    }
  });

  it('media 쿼리가 device-width / device-height / -webkit-device-pixel-ratio를 스펙 값으로 담는다', () => {
    const images = getAppleSplashStartupImages();
    for (const spec of APPLE_SPLASH_SPECS) {
      const image = images.find((item) => item.url === getAppleSplashUrl(spec));
      expect(image, `${spec.width}x${spec.height}`).toBeDefined();
      expect(image?.media).toBe(
        `(device-width: ${spec.deviceWidth}px) and (device-height: ${spec.deviceHeight}px) and (-webkit-device-pixel-ratio: ${spec.ratio}) and (orientation: portrait)`,
      );
    }
  });
});

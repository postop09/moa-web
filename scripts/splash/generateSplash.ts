/**
 * iOS 홈 화면 앱용 스플래시 PNG를 `APPLE_SPLASH_SPECS` 해상도마다 생성합니다.
 * 스펙을 바꾼 뒤에는 `pnpm splash:generate`를 다시 실행해야 합니다.
 */
import { mkdir, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

import { APPLE_SPLASH_SPECS } from '../../src/shared/config';
import { getIconPlacement } from './getIconPlacement';

const ROOT = path.resolve(import.meta.dirname, '../..');
const ICON_PATH = path.join(ROOT, 'public/icons/icon-512.png');
const OUTPUT_DIR = path.join(ROOT, 'public/splash');

// app/layout.tsx의 html/body 배경 및 themeColor와 같은 값
const BACKGROUND = '#f4f6f8';

const toFileName = (width: number, height: number) =>
  `apple-splash-${width}-${height}.png`;

// 스펙에서 빠진 해상도의 옛 PNG가 public/splash에 남으면 프리캐시·커밋에 죽은 파일이 쌓인다.
const removeStaleFiles = async (keep: ReadonlySet<string>) => {
  const files = await readdir(OUTPUT_DIR);
  const stale = files.filter(
    (file) =>
      file.startsWith('apple-splash-') &&
      file.endsWith('.png') &&
      !keep.has(file),
  );

  for (const file of stale) {
    await unlink(path.join(OUTPUT_DIR, file));
  }

  console.log(
    stale.length > 0
      ? `removed ${stale.length} stale file(s): ${stale.join(', ')}`
      : 'removed 0 stale file(s)',
  );
};

const generate = async () => {
  await mkdir(OUTPUT_DIR, { recursive: true });

  for (const { width, height } of APPLE_SPLASH_SPECS) {
    const { size, left, top } = getIconPlacement({ width, height });
    const outputPath = path.join(OUTPUT_DIR, toFileName(width, height));

    const icon = await sharp(ICON_PATH)
      .resize(size, size, { fit: 'contain' })
      .png()
      .toBuffer();

    await sharp({
      create: { width, height, channels: 3, background: BACKGROUND },
    })
      .composite([{ input: icon, left, top }])
      // 단색 배경 + 단색 로고라 알파를 걷어내고 팔레트 PNG로 저장하면 용량이 절반 이하로 줄어든다.
      .flatten({ background: BACKGROUND })
      .png({ palette: true, compressionLevel: 9 })
      .toFile(outputPath);

    console.log(`generated: ${path.relative(ROOT, outputPath)}`);
  }

  await removeStaleFiles(
    new Set(
      APPLE_SPLASH_SPECS.map((spec) => toFileName(spec.width, spec.height)),
    ),
  );
};

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});

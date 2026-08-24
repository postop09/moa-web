/**
 * OG 이미지(1200x630)를 정적 PNG로 생성합니다.
 * 한글 렌더링을 위해 시스템 폰트를 사용하므로, 문구를 바꾼 뒤에는
 * 한글 폰트가 설치된 환경에서 `pnpm og:generate`를 다시 실행해야 합니다.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

const WIDTH = 1200;
const HEIGHT = 630;

const ROOT = path.resolve(import.meta.dirname, '..');
const LOGO_PATH = path.join(ROOT, 'public/icons/icon_logo_black.png');
const OUTPUT_DIR = path.join(ROOT, 'public/og');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'og-default.png');

const LOGO_SIZE = 64;
const LOGO_X = 80;
const LOGO_Y = 72;

const FONT_FAMILY =
  "'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif";

const buildBackdrop = () => `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
        <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(15,23,42,0.05)" stroke-width="1" />
      </pattern>
      <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f4f6f8" stop-opacity="0" />
        <stop offset="100%" stop-color="#f4f6f8" stop-opacity="0.9" />
      </linearGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#f4f6f8" />
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)" />
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#fade)" />
    <rect x="0" y="${HEIGHT - 10}" width="${WIDTH}" height="10" fill="#2563eb" />
  </svg>
`;

const CARD = { x: 672, y: 150, width: 448, height: 330, radius: 16 };
const BAR_BASELINE = CARD.y + CARD.height - 56;
const BARS = [
  { height: 118, fill: '#2563eb' },
  { height: 196, fill: '#dc2626' },
  { height: 92, fill: '#16a34a' },
  { height: 158, fill: '#2563eb' },
  { height: 128, fill: '#dc2626' },
];
const BAR_WIDTH = 48;
const BAR_GAP = 24;
const BAR_START_X = CARD.x + 40;

const buildBars = () => {
  return BARS.map((bar, index) => {
    const x = BAR_START_X + index * (BAR_WIDTH + BAR_GAP);
    const y = BAR_BASELINE - bar.height;

    return `<rect x="${x}" y="${y}" width="${BAR_WIDTH}" height="${bar.height}" rx="6" fill="${bar.fill}" opacity="0.9" />`;
  }).join('\n    ');
};

const buildText = () => `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <text x="${LOGO_X + LOGO_SIZE + 16}" y="${LOGO_Y + 44}" font-family="${FONT_FAMILY}" font-size="34" font-weight="600" fill="#0f172a" letter-spacing="-1">모아</text>

    <text x="${LOGO_X}" y="252" font-family="${FONT_FAMILY}" font-size="24" font-weight="600" fill="#2563eb" letter-spacing="3">MOA</text>
    <text x="${LOGO_X}" y="336" font-family="${FONT_FAMILY}" font-size="72" font-weight="700" fill="#0f172a" letter-spacing="-3">그래프로 보는</text>
    <text x="${LOGO_X}" y="416" font-family="${FONT_FAMILY}" font-size="72" font-weight="700" fill="#0f172a" letter-spacing="-3">가계부</text>
    <text x="${LOGO_X}" y="478" font-family="${FONT_FAMILY}" font-size="28" font-weight="400" fill="#64748b" letter-spacing="-1">수입과 지출, 저축의 흐름을 한눈에</text>

    <text x="${LOGO_X}" y="552" font-family="${FONT_FAMILY}" font-size="22" font-weight="500" fill="#94a3b8" letter-spacing="-0.5">설치 없이 브라우저에서 바로 · 가족과 함께</text>

    <rect x="${CARD.x}" y="${CARD.y}" width="${CARD.width}" height="${CARD.height}" rx="${CARD.radius}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
    <text x="${CARD.x + 40}" y="${CARD.y + 56}" font-family="${FONT_FAMILY}" font-size="20" font-weight="600" fill="#64748b" letter-spacing="-0.5">이번 달 흐름</text>
    <line x1="${CARD.x + 40}" y1="${BAR_BASELINE + 1}" x2="${CARD.x + CARD.width - 40}" y2="${BAR_BASELINE + 1}" stroke="#e2e8f0" stroke-width="2" />
    ${buildBars()}
  </svg>
`;

const generate = async () => {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const logo = await sharp(LOGO_PATH)
    .resize(LOGO_SIZE, LOGO_SIZE, { fit: 'contain' })
    .png()
    .toBuffer();

  await sharp(Buffer.from(buildBackdrop()))
    .composite([
      { input: logo, top: LOGO_Y, left: LOGO_X },
      { input: Buffer.from(buildText()), top: 0, left: 0 },
    ])
    .png()
    .toFile(OUTPUT_PATH);

  console.log(`generated: ${path.relative(ROOT, OUTPUT_PATH)}`);
};

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});

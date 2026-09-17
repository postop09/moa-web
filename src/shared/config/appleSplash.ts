export type AppleSplashSpec = {
  /** 생성할 PNG의 픽셀 너비 (= deviceWidth × ratio) */
  width: number;
  /** 생성할 PNG의 픽셀 높이 (= deviceHeight × ratio) */
  height: number;
  /** CSS px 기준 기기 너비 (media 쿼리의 device-width) */
  deviceWidth: number;
  /** CSS px 기준 기기 높이 (media 쿼리의 device-height) */
  deviceHeight: number;
  /** -webkit-device-pixel-ratio */
  ratio: 2 | 3;
};

// iPhone 12종(신형→구형) 다음 iPad 9종. 앱이 세로 전용 UI이고 다크 모드가 없어 가로·다크 변형은 제외한다.
export const APPLE_SPLASH_SPECS: readonly AppleSplashSpec[] = [
  // iPhone
  { width: 1320, height: 2868, deviceWidth: 440, deviceHeight: 956, ratio: 3 }, // 16 Pro Max / 17 Pro Max
  { width: 1290, height: 2796, deviceWidth: 430, deviceHeight: 932, ratio: 3 }, // 14 Pro Max ~ 15/16 Plus
  { width: 1260, height: 2736, deviceWidth: 420, deviceHeight: 912, ratio: 3 }, // 17 / Air
  { width: 1206, height: 2622, deviceWidth: 402, deviceHeight: 874, ratio: 3 }, // 16 Pro
  { width: 1179, height: 2556, deviceWidth: 393, deviceHeight: 852, ratio: 3 }, // 14 Pro / 15 / 16
  { width: 1284, height: 2778, deviceWidth: 428, deviceHeight: 926, ratio: 3 }, // 12/13 Pro Max
  { width: 1170, height: 2532, deviceWidth: 390, deviceHeight: 844, ratio: 3 }, // 12/13/14
  { width: 1242, height: 2688, deviceWidth: 414, deviceHeight: 896, ratio: 3 }, // XS Max / 11 Pro Max
  { width: 1125, height: 2436, deviceWidth: 375, deviceHeight: 812, ratio: 3 }, // X / XS / 11 Pro
  { width: 828, height: 1792, deviceWidth: 414, deviceHeight: 896, ratio: 2 }, // XR / 11
  { width: 1242, height: 2208, deviceWidth: 414, deviceHeight: 736, ratio: 3 }, // 6/7/8 Plus
  { width: 750, height: 1334, deviceWidth: 375, deviceHeight: 667, ratio: 2 }, // 6/7/8 / SE 2·3
  // iPad
  {
    width: 2064,
    height: 2752,
    deviceWidth: 1032,
    deviceHeight: 1376,
    ratio: 2,
  }, // Pro 13" M4
  {
    width: 2048,
    height: 2732,
    deviceWidth: 1024,
    deviceHeight: 1366,
    ratio: 2,
  }, // Pro 12.9"
  { width: 1668, height: 2420, deviceWidth: 834, deviceHeight: 1210, ratio: 2 }, // Pro 11" M4
  { width: 1668, height: 2388, deviceWidth: 834, deviceHeight: 1194, ratio: 2 }, // Pro 11" / Air 10.9"
  { width: 1668, height: 2224, deviceWidth: 834, deviceHeight: 1112, ratio: 2 }, // Pro 10.5" / Air 3
  { width: 1640, height: 2360, deviceWidth: 820, deviceHeight: 1180, ratio: 2 }, // Air 4·5
  { width: 1620, height: 2160, deviceWidth: 810, deviceHeight: 1080, ratio: 2 }, // 10.2"
  { width: 1536, height: 2048, deviceWidth: 768, deviceHeight: 1024, ratio: 2 }, // 9.7" / mini 4·5
  { width: 1488, height: 2266, deviceWidth: 744, deviceHeight: 1133, ratio: 2 }, // mini 6·7
];

export const getAppleSplashUrl = (spec: AppleSplashSpec) =>
  `/splash/apple-splash-${spec.width}-${spec.height}.png`;

export const getAppleSplashStartupImages = () =>
  APPLE_SPLASH_SPECS.map((spec) => ({
    url: getAppleSplashUrl(spec),
    media: `(device-width: ${spec.deviceWidth}px) and (device-height: ${spec.deviceHeight}px) and (-webkit-device-pixel-ratio: ${spec.ratio}) and (orientation: portrait)`,
  }));

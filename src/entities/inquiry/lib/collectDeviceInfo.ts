import type { DeviceInfo } from '../model/deviceInfo';

type Params = {
  userAgent: string;
  language: string;
  appVersion: string;
  maxTouchPoints?: number;
};

const parseOsAndDevice = (
  ua: string,
  maxTouchPoints?: number,
): Pick<DeviceInfo, 'os' | 'device'> => {
  const ios = ua.match(/(iPhone|iPad|iPod)[^)]*?OS (\d+)[_.](\d+)/);
  if (ios) {
    return { os: `iOS ${ios[2]}.${ios[3]}`, device: ios[1] };
  }

  const android = ua.match(/Android (\d+(?:\.\d+)?)/);
  if (android) {
    const model = ua.match(/Android [\d.]+;\s*([^;)]+)/);
    // reduced UA는 모델 자리에 'K' 같은 한 글자 토큰을 넣으므로 모델로 취급하지 않는다
    const name = model ? model[1].trim() : '';
    return {
      os: `Android ${android[1]}`,
      device: name.length > 1 ? name : 'Android',
    };
  }

  if (/Macintosh/.test(ua)) {
    // iPadOS Safari는 데스크톱 Mac UA를 보내므로 터치 포인트로 구분한다
    if (maxTouchPoints !== undefined && maxTouchPoints > 1) {
      return { os: 'iPadOS', device: 'iPad' };
    }
    return { os: 'macOS', device: 'Desktop' };
  }
  if (/Windows/.test(ua)) return { os: 'Windows', device: 'Desktop' };

  return { os: 'unknown', device: 'unknown' };
};

export const parseDeviceInfo = ({
  userAgent,
  language,
  appVersion,
  maxTouchPoints,
}: Params): DeviceInfo => ({
  appVersion,
  ...parseOsAndDevice(userAgent, maxTouchPoints),
  language,
});

type DeviceExtras = Pick<
  DeviceInfo,
  'errorCode' | 'entryScreen' | 'lastSyncedAt'
>;

/** 제공된(undefined가 아닌) extras만 합친 새 객체를 반환한다. 원본은 변경하지 않는다. */
export const withDeviceExtras = (
  info: DeviceInfo,
  extras: DeviceExtras,
): DeviceInfo => {
  const next: DeviceInfo = { ...info };
  if (extras.errorCode !== undefined) next.errorCode = extras.errorCode;
  if (extras.entryScreen !== undefined) next.entryScreen = extras.entryScreen;
  if (extras.lastSyncedAt !== undefined)
    next.lastSyncedAt = extras.lastSyncedAt;
  return next;
};

export const collectDeviceInfo = (): DeviceInfo =>
  parseDeviceInfo({
    userAgent: navigator.userAgent,
    language: navigator.language,
    maxTouchPoints: navigator.maxTouchPoints,
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? 'unknown',
  });

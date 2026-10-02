import { formatInquiryDetailDate } from '@/entities/inquiry';

const ROWS: { key: string; label: string; isDate?: boolean }[] = [
  { key: 'appVersion', label: '앱 버전' },
  { key: 'os', label: 'OS' },
  { key: 'device', label: '기기' },
  { key: 'language', label: '언어' },
  { key: 'errorCode', label: '오류 코드' },
  { key: 'entryScreen', label: '진입 화면' },
  { key: 'lastSyncedAt', label: '마지막 동기화', isDate: true },
];

export type DeviceRow = { label: string; value: string };

/** 값이 있는 항목만 순서대로 돌려준다. */
export const getDeviceRows = (
  deviceInfo: Record<string, unknown> | null,
): DeviceRow[] => {
  if (!deviceInfo) return [];

  return ROWS.flatMap(({ key, label, isDate }) => {
    const raw = deviceInfo[key];

    if (typeof raw !== 'string' || raw.trim() === '') return [];

    const value =
      isDate && !Number.isNaN(Date.parse(raw))
        ? formatInquiryDetailDate(raw)
        : raw;

    return [{ label, value }];
  });
};

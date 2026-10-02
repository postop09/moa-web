const MIME_BY_EXTENSION: Record<string, string> = {
  heic: 'image/heic',
  heif: 'image/heif',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/** 파일명 확장자(대소문자 무시)로 허용 MIME 을 찾는다. 허용 밖이면 null. */
export const getImageMimeByName = (name: string | undefined): string | null => {
  if (!name) return null;

  const dot = name.lastIndexOf('.');
  if (dot < 0) return null;

  return MIME_BY_EXTENSION[name.slice(dot + 1).toLowerCase()] ?? null;
};

const NAME = 'PhotoUploadError';

/** 사진 업로드 단계의 실패. 제출 실패 안내를 구분하는 데 쓴다. */
export const createPhotoUploadError = (cause: unknown) =>
  Object.assign(new Error('photo_upload_failed', { cause }), { name: NAME });

export const isPhotoUploadError = (error: unknown) =>
  error instanceof Error && error.name === NAME;

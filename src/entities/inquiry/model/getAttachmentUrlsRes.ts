/** 입력 paths와 1:1 순서로 대응한다. 서명 실패 시 url은 null. */
export type GetAttachmentUrlsRes = { path: string; url: string | null }[];

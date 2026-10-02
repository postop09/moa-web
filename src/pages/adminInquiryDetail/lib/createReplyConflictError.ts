/**
 * 미리보기를 연 뒤 화면이 받은 최신 값이 달라졌을 때 서버에 보내기 전에 던지는 충돌.
 * 서버의 conflict 거절과 같은 종류로 읽혀 같은 안내(새로고침)를 탄다.
 */
export const createReplyConflictError = () => new Error('conflict');

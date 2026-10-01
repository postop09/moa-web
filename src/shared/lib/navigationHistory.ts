// 이 탭에서 앱 내 이전 화면이 있는지(push 이동이 있었는지)와, 마지막으로 본
// window.history.length 기준값을 기록한다. 새로고침에도 유지되도록 sessionStorage에
// 저장하고, 접근이 막히면(throw) 모듈 상태로 대체한다.
const FLAG_KEY = 'moa:inAppHistory';
const LENGTH_KEY = 'moa:historyLength';

let memoryFlag = false;
let memoryLength: number | null = null;

const readStorage = (key: string): string | null => {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // 모듈 상태가 대체한다.
  }
};

export const markInAppNavigation = () => {
  memoryFlag = true;
  writeStorage(FLAG_KEY, '1');
};

export const clearInAppNavigation = () => {
  memoryFlag = false;
  try {
    window.sessionStorage.removeItem(FLAG_KEY);
  } catch {
    // 모듈 상태가 대체한다.
  }
};

export const getHasInAppHistory = () =>
  memoryFlag || readStorage(FLAG_KEY) === '1';

export const setHistoryLengthBaseline = (length: number) => {
  memoryLength = length;
  writeStorage(LENGTH_KEY, String(length));
};

export const getHistoryLengthBaseline = (): number | null => {
  const stored = readStorage(LENGTH_KEY);
  const parsed = stored === null ? NaN : Number(stored);

  return Number.isFinite(parsed) ? parsed : memoryLength;
};

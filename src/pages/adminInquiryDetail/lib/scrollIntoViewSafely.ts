/** 움직임 줄이기를 켠 사용자에게는 부드러운 스크롤 없이 바로 옮긴다. */
export const scrollIntoViewSafely = (element: Element | null | undefined) => {
  if (!element || typeof element.scrollIntoView !== 'function') return;

  const reduceMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  element.scrollIntoView({
    block: 'nearest',
    behavior: reduceMotion ? 'auto' : 'smooth',
  });
};

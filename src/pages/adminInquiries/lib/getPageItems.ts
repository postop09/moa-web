export type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

const WINDOW = 2;

/** 현재 페이지 주변 ±2쪽과 처음·끝 쪽을 보여주고 나머지는 말줄임으로 접는다. */
export const getPageItems = (current: number, total: number): PageItem[] => {
  if (total <= 1) return [1];

  const start = Math.max(2, current - WINDOW);
  const end = Math.min(total - 1, current + WINDOW);
  const items: PageItem[] = [1];

  if (start > 2) items.push('ellipsis-start');
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < total - 1) items.push('ellipsis-end');
  items.push(total);

  return items;
};

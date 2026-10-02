import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { INQUIRY_MAX_IMAGES } from '@/entities/inquiry';

import { useImageAttachments } from './useImageAttachments';

const MB = 1024 * 1024;

const makeFile = (name: string, size = 1024, type = 'image/png') => {
  const file = new File(['x'], name, { type });

  Object.defineProperty(file, 'size', { value: size });

  return file;
};

let urlCount = 0;

beforeEach(() => {
  urlCount = 0;
  URL.createObjectURL = vi.fn(() => `blob:preview-${(urlCount += 1)}`);
  URL.revokeObjectURL = vi.fn();
});

const setup = (onReject = vi.fn()) => {
  const view = renderHook(
    ({ onReject: handler }) =>
      useImageAttachments({ max: INQUIRY_MAX_IMAGES, onReject: handler }),
    { initialProps: { onReject } },
  );

  return { ...view, onReject };
};

type Hook = ReturnType<typeof setup>['result'];

const add = (result: Hook, files: File[]) => {
  let returned: unknown;

  act(() => {
    returned = result.current.addFiles(files);
  });

  return returned;
};

describe('useImageAttachments - 추가', () => {
  it('처음에는 사진이 없다', () => {
    const { result } = setup();

    expect(result.current.photos).toEqual([]);
  });

  it('유효한 파일을 {id, file, url} 로 추가하고 파일마다 object URL 을 만든다', () => {
    const { result, onReject } = setup();
    const a = makeFile('a.png');
    const b = makeFile('b.jpg', 1024, 'image/jpeg');

    const returned = add(result, [a, b]);

    expect(returned).toEqual({ ok: true, count: 2 });
    expect(result.current.photos).toHaveLength(2);
    expect(result.current.photos.map((photo) => photo.file)).toEqual([a, b]);
    expect(result.current.photos.map((photo) => photo.url)).toEqual([
      'blob:preview-1',
      'blob:preview-2',
    ]);
    expect(new Set(result.current.photos.map((photo) => photo.id)).size).toBe(
      2,
    );
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    expect(onReject).not.toHaveBeenCalled();
  });

  it('이어서 추가하면 누적되고 돌려주는 count 는 전체 장수다', () => {
    const { result } = setup();
    add(result, [makeFile('a.png')]);

    const returned = add(result, [makeFile('b.png'), makeFile('c.png')]);

    expect(returned).toEqual({ ok: true, count: 3 });
    expect(result.current.photos.map((photo) => photo.file.name)).toEqual([
      'a.png',
      'b.png',
      'c.png',
    ]);
  });

  it('정확히 10MB 3장과 type 이 빈 HEIC(확장자 판단)은 허용한다', () => {
    const { result, onReject } = setup();

    add(result, [
      makeFile('a.png', 10 * MB),
      makeFile('b.png', 10 * MB),
      makeFile('c.heic', 10 * MB, ''),
    ]);

    expect(result.current.photos).toHaveLength(3);
    expect(onReject).not.toHaveBeenCalled();
  });

  it('빈 목록은 아무것도 하지 않는다 (거절로도 알리지 않는다)', () => {
    const { result, onReject } = setup();

    add(result, []);

    expect(result.current.photos).toEqual([]);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(onReject).not.toHaveBeenCalled();
  });
});

describe('useImageAttachments - 거절', () => {
  it('개수 초과는 하나도 추가하지 않고 onReject("count") 를 한 번 부른다', () => {
    const { result, onReject } = setup();

    const returned = add(result, [
      makeFile('a.png'),
      makeFile('b.png'),
      makeFile('c.png'),
      makeFile('d.png'),
    ]);

    expect(returned).toEqual({ ok: false, reason: 'count' });
    expect(result.current.photos).toEqual([]);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledWith('count');
  });

  it('이미 있는 장수를 함께 센다 (2장 + 2장 은 거절, 기존 2장은 유지)', () => {
    const { result, onReject } = setup();
    add(result, [makeFile('a.png'), makeFile('b.png')]);

    add(result, [makeFile('c.png'), makeFile('d.png')]);

    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledWith('count');
    expect(result.current.photos.map((photo) => photo.file.name)).toEqual([
      'a.png',
      'b.png',
    ]);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
  });

  it('지원하지 않는 형식은 onReject("type") 이다', () => {
    const { result, onReject } = setup();

    add(result, [makeFile('a.gif', 1024, 'image/gif')]);

    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledWith('type');
    expect(result.current.photos).toEqual([]);
  });

  it('10MB 초과는 onReject("size") 이다', () => {
    const { result, onReject } = setup();

    add(result, [makeFile('big.png', 10 * MB + 1)]);

    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledWith('size');
    expect(result.current.photos).toEqual([]);
  });

  it('유효한 파일과 잘못된 파일이 섞이면 하나도 추가하지 않는다 (all-or-nothing)', () => {
    const { result, onReject } = setup();

    add(result, [
      makeFile('ok.png'),
      makeFile('bad.pdf', 1024, 'application/pdf'),
    ]);

    expect(result.current.photos).toEqual([]);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(onReject).toHaveBeenCalledWith('type');
  });

  it('우선순위는 개수 > 형식 > 크기 다', () => {
    const { result, onReject } = setup();
    add(result, [makeFile('a.png'), makeFile('b.png')]);

    add(result, [
      makeFile('c.gif', 10 * MB + 1, 'image/gif'),
      makeFile('d.png'),
    ]);
    expect(onReject).toHaveBeenLastCalledWith('count');

    add(result, [makeFile('e.gif', 10 * MB + 1, 'image/gif')]);
    expect(onReject).toHaveBeenLastCalledWith('type');
    expect(onReject).toHaveBeenCalledTimes(2);
  });

  it('거절 한 번에 onReject 도 한 번만 부른다 (거절이 쌓이면 그만큼)', () => {
    const { result, onReject } = setup();

    add(result, [makeFile('a.gif', 1024, 'image/gif')]);
    add(result, [makeFile('b.png', 10 * MB + 1)]);

    expect(onReject).toHaveBeenCalledTimes(2);
    expect(onReject).toHaveBeenNthCalledWith(1, 'type');
    expect(onReject).toHaveBeenNthCalledWith(2, 'size');
  });

  it('렌더 사이에 바뀐 onReject 를 부른다 (낡은 콜백을 붙들지 않는다)', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = setup(first);

    rerender({ onReject: second });
    add(result, [makeFile('a.gif', 1024, 'image/gif')]);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith('type');
  });
});

describe('useImageAttachments - 삭제와 object URL 해제', () => {
  it('삭제하면 그 사진의 URL 만 해제하고 남은 장수를 돌려준다', () => {
    const { result } = setup();
    add(result, [makeFile('a.png'), makeFile('b.png')]);
    const [first, second] = result.current.photos;
    let remaining: unknown;

    act(() => {
      remaining = result.current.removePhoto(first.id);
    });

    expect(remaining).toBe(1);
    expect(result.current.photos).toEqual([second]);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(first.url);
  });

  it('마지막 사진을 지우면 0 을 돌려준다', () => {
    const { result } = setup();
    add(result, [makeFile('a.png')]);
    let remaining: unknown;

    act(() => {
      remaining = result.current.removePhoto(result.current.photos[0].id);
    });

    expect(remaining).toBe(0);
    expect(result.current.photos).toEqual([]);
  });

  it('없는 id 는 null 을 돌려주고 아무것도 해제하지 않는다', () => {
    const { result } = setup();
    add(result, [makeFile('a.png')]);
    let remaining: unknown;

    act(() => {
      remaining = result.current.removePhoto('nope');
    });

    expect(remaining).toBeNull();
    expect(result.current.photos).toHaveLength(1);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it('clear 는 모든 URL 을 해제하고 목록을 비운다', () => {
    const { result } = setup();
    add(result, [makeFile('a.png'), makeFile('b.png'), makeFile('c.png')]);
    const urls = result.current.photos.map((photo) => photo.url);

    act(() => result.current.clear());

    expect(result.current.photos).toEqual([]);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3);
    urls.forEach((url) =>
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(url),
    );
  });

  it('clear 뒤에는 다시 처음부터 3장을 받을 수 있다', () => {
    const { result, onReject } = setup();
    add(result, [makeFile('a.png'), makeFile('b.png'), makeFile('c.png')]);
    act(() => result.current.clear());

    add(result, [makeFile('d.png'), makeFile('e.png'), makeFile('f.png')]);

    expect(result.current.photos).toHaveLength(3);
    expect(onReject).not.toHaveBeenCalled();
  });

  it('언마운트하면 아직 남은 URL 만 한 번씩 해제한다 (이미 해제한 URL 은 다시 해제하지 않는다)', () => {
    const { result, unmount } = setup();
    add(result, [makeFile('a.png'), makeFile('b.png'), makeFile('c.png')]);
    const [removed, ...rest] = result.current.photos;
    act(() => {
      result.current.removePhoto(removed.id);
    });
    vi.mocked(URL.revokeObjectURL).mockClear();

    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    rest.forEach((photo) =>
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(photo.url),
    );
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(removed.url);
  });

  it('clear 한 뒤 언마운트해도 같은 URL 을 두 번 해제하지 않는다', () => {
    const { result, unmount } = setup();
    add(result, [makeFile('a.png'), makeFile('b.png')]);
    act(() => result.current.clear());

    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it('거절된 추가는 URL 을 만들지도 해제하지도 않는다', () => {
    const { result, unmount } = setup();

    add(result, [makeFile('a.gif', 1024, 'image/gif')]);
    unmount();

    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });
});

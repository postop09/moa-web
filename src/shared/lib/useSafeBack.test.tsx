import { render, renderHook } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 설계(테스트가 가정하는 계약)
// - <InAppNavigationTracker /> 는 앱 셸에 한 번 마운트되고 usePathname() 이 바뀌는 것을
//   관찰한다. 첫 마운트 경로 -> 다른 경로로 바뀌는 순간 "이 탭에서 앱 내 이전 화면이
//   있다"는 플래그(module-level 또는 sessionStorage)를 켠다.
// - useSafeBack(fallbackHref) 는 goBack 함수를 직접 돌려준다. goBack 은 호출 시점에
//   플래그를 읽어 true 면 router.back(), false 면 router.replace(fallbackHref).
// 모듈 레벨 상태가 테스트 간에 새지 않도록 매 테스트마다 모듈을 새로 불러온다.

const router = {
  back: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  forward: vi.fn(),
};
let pathname = '/support';

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => pathname,
}));

let CurrentTracker: () => null = () => null;

const load = async () => {
  vi.resetModules();
  const [{ useSafeBack }, { InAppNavigationTracker }] = await Promise.all([
    import('./useSafeBack'),
    import('./InAppNavigationTracker'),
  ]);

  CurrentTracker = InAppNavigationTracker;

  return { useSafeBack, InAppNavigationTracker };
};

const navigate = (
  view: { rerender: (ui: ReactElement) => void },
  to: string,
  kind: 'push' | 'replace',
) => {
  pathname = to;
  if (kind === 'push') window.history.pushState(null, '', to);
  else window.history.replaceState(null, '', to);
  view.rerender(<CurrentTracker />);
};

type NavType = 'navigate' | 'reload' | 'back_forward' | 'prerender';

// 이전 문서에서 push 이동이 있었던 sessionStorage 상태를 만든다.
const seedStaleHistory = () => {
  window.sessionStorage.setItem('moa:inAppHistory', '1');
  window.sessionStorage.setItem(
    'moa:historyLength',
    String(window.history.length),
  );
};

// performance.getEntriesByType('navigation') 응답을 흉내 낸다.
const mockNavigationEntry = (
  entry: NavType | 'missing' | 'throws',
): ReturnType<typeof vi.spyOn> =>
  vi.spyOn(performance, 'getEntriesByType').mockImplementation(() => {
    if (entry === 'throws') throw new Error('unavailable');
    if (entry === 'missing') return [];

    return [{ type: entry }] as unknown as PerformanceEntryList;
  });

afterEach(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
  pathname = '/support';
});

describe('useSafeBack', () => {
  it('앱 내 이전 화면이 기록되지 않은 직접 진입이면 fallback 으로 replace 한다', async () => {
    const { useSafeBack, InAppNavigationTracker } = await load();
    render(<InAppNavigationTracker />);
    const { result } = renderHook(() => useSafeBack('/support'));

    result.current();

    expect(router.replace).toHaveBeenCalledWith('/support');
    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.back).not.toHaveBeenCalled();
  });

  it('tracker 가 없어도(기록 없음) fallback 으로 replace 한다', async () => {
    const { useSafeBack } = await load();
    const { result } = renderHook(() => useSafeBack('/support/inquiries/7'));

    result.current();

    expect(router.replace).toHaveBeenCalledWith('/support/inquiries/7');
    expect(router.back).not.toHaveBeenCalled();
  });

  it('tracker 가 첫 경로만 봤다면(이동 없음) 아직 직접 진입이다', async () => {
    const { useSafeBack, InAppNavigationTracker } = await load();
    const view = render(<InAppNavigationTracker />);
    view.rerender(<InAppNavigationTracker />);
    const { result } = renderHook(() => useSafeBack('/support'));

    result.current();

    expect(router.replace).toHaveBeenCalledWith('/support');
    expect(router.back).not.toHaveBeenCalled();
  });

  it('push 로 다른 경로에 이동한 뒤에는 router.back() 을 호출한다', async () => {
    const { useSafeBack, InAppNavigationTracker } = await load();
    const view = render(<InAppNavigationTracker />);
    navigate(view, '/support/inquiries/new', 'push');
    const { result } = renderHook(() => useSafeBack('/support'));

    result.current();

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('replace 로만 경로가 바뀌었다면(history.length 불변) 직접 진입으로 보고 fallback 으로 replace 한다', async () => {
    const { useSafeBack, InAppNavigationTracker } = await load();
    const view = render(<InAppNavigationTracker />);
    navigate(view, '/a', 'replace');
    navigate(view, '/b', 'replace');
    const { result } = renderHook(() => useSafeBack('/support'));

    result.current();

    expect(router.replace).toHaveBeenCalledWith('/support');
    expect(router.back).not.toHaveBeenCalled();
  });

  it('replace 뒤에 push 가 한 번이라도 있으면 router.back() 을 호출한다', async () => {
    const { useSafeBack, InAppNavigationTracker } = await load();
    const view = render(<InAppNavigationTracker />);
    navigate(view, '/a', 'replace');
    navigate(view, '/b', 'push');
    const { result } = renderHook(() => useSafeBack('/support'));

    result.current();

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('push 후 replace 가 이어져도 기록은 유지된다', async () => {
    const { useSafeBack, InAppNavigationTracker } = await load();
    const view = render(<InAppNavigationTracker />);
    navigate(view, '/a', 'push');
    navigate(view, '/b', 'replace');
    const { result } = renderHook(() => useSafeBack('/support'));

    result.current();

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('첫 마운트만으로는 플래그가 켜지지 않는다 (history.length 가 이미 커도)', async () => {
    window.history.pushState(null, '', '/x');
    window.history.pushState(null, '', '/y');
    const { useSafeBack, InAppNavigationTracker } = await load();
    render(<InAppNavigationTracker />);
    const { result } = renderHook(() => useSafeBack('/support'));

    result.current();

    expect(router.replace).toHaveBeenCalledWith('/support');
    expect(router.back).not.toHaveBeenCalled();
  });

  it('이동 기록은 훅이 나중에 마운트돼도 유지된다 (화면 간 공유)', async () => {
    const { useSafeBack, InAppNavigationTracker } = await load();
    const view = render(<InAppNavigationTracker />);
    navigate(view, '/a', 'push');
    navigate(view, '/b', 'push');

    const first = renderHook(() => useSafeBack('/support'));
    first.unmount();
    const second = renderHook(() => useSafeBack('/support'));
    second.result.current();

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('goBack 은 렌더가 아니라 호출 시점의 기록을 읽는다', async () => {
    const { useSafeBack, InAppNavigationTracker } = await load();
    const view = render(<InAppNavigationTracker />);
    const { result } = renderHook(() => useSafeBack('/support'));
    const goBack = result.current;

    navigate(view, '/support/inquiries/new', 'push');
    goBack();

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('sessionStorage 를 유지한 채 모듈이 다시 로드(새로고침)돼도 push 기록이 유지된다', async () => {
    const first = await load();
    const view = render(<first.InAppNavigationTracker />);
    navigate(view, '/a', 'push');
    view.unmount();

    const second = await load();
    render(<second.InAppNavigationTracker />);
    const { result } = renderHook(() => second.useSafeBack('/support'));
    result.current();

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('새로고침 뒤 replace 만 일어나면 기록이 없는 상태로 남는다', async () => {
    const first = await load();
    const view = render(<first.InAppNavigationTracker />);
    navigate(view, '/a', 'replace');
    view.unmount();

    const second = await load();
    const view2 = render(<second.InAppNavigationTracker />);
    navigate(view2, '/b', 'replace');
    const { result } = renderHook(() => second.useSafeBack('/support'));
    result.current();

    expect(router.replace).toHaveBeenCalledWith('/support');
    expect(router.back).not.toHaveBeenCalled();
  });

  it('sessionStorage 접근이 throw 해도 크래시 없이 모듈 상태로 동작한다', async () => {
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('denied');
      });
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('denied');
      });
    try {
      const { useSafeBack, InAppNavigationTracker } = await load();
      const view = render(<InAppNavigationTracker />);
      expect(() => navigate(view, '/a', 'push')).not.toThrow();
      const { result } = renderHook(() => useSafeBack('/support'));

      expect(() => result.current()).not.toThrow();
      expect(router.back).toHaveBeenCalledTimes(1);
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });

  it('같은 fallback 이면 리렌더해도 goBack 참조가 안정적이다', async () => {
    const { useSafeBack } = await load();
    const { result, rerender } = renderHook(({ href }) => useSafeBack(href), {
      initialProps: { href: '/support' },
    });
    const first = result.current;

    rerender({ href: '/support' });

    expect(result.current).toBe(first);
  });

  it('fallback 이 바뀌면 새 fallback 으로 replace 한다', async () => {
    const { useSafeBack } = await load();
    const { result, rerender } = renderHook(({ href }) => useSafeBack(href), {
      initialProps: { href: '/support' },
    });

    rerender({ href: '/support/inquiries/9' });
    result.current();

    expect(router.replace).toHaveBeenCalledWith('/support/inquiries/9');
  });
});

describe('InAppNavigationTracker 새 문서 진입 시 기록 초기화', () => {
  it("navigation type 이 'navigate' 면 이전 문서의 플래그를 지워 fallback 으로 replace 한다", async () => {
    seedStaleHistory();
    mockNavigationEntry('navigate');
    const { useSafeBack, InAppNavigationTracker } = await load();
    render(<InAppNavigationTracker />);
    const { result } = renderHook(() => useSafeBack('/support'));

    result.current();

    expect(router.replace).toHaveBeenCalledWith('/support');
    expect(router.back).not.toHaveBeenCalled();
  });

  it("'reload' 면 저장된 플래그를 유지해 router.back() 을 호출한다", async () => {
    seedStaleHistory();
    mockNavigationEntry('reload');
    const { useSafeBack, InAppNavigationTracker } = await load();
    render(<InAppNavigationTracker />);
    const { result } = renderHook(() => useSafeBack('/support'));

    result.current();

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("'back_forward' 면 저장된 플래그를 유지한다", async () => {
    seedStaleHistory();
    mockNavigationEntry('back_forward');
    const { useSafeBack, InAppNavigationTracker } = await load();
    render(<InAppNavigationTracker />);
    const { result } = renderHook(() => useSafeBack('/support'));

    result.current();

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('navigation entry 가 없으면 저장된 플래그를 유지한다', async () => {
    seedStaleHistory();
    mockNavigationEntry('missing');
    const { useSafeBack, InAppNavigationTracker } = await load();
    render(<InAppNavigationTracker />);
    const { result } = renderHook(() => useSafeBack('/support'));

    result.current();

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('getEntriesByType 이 throw 해도 크래시 없이 저장된 플래그를 유지한다', async () => {
    seedStaleHistory();
    mockNavigationEntry('throws');
    const { useSafeBack, InAppNavigationTracker } = await load();

    expect(() => render(<InAppNavigationTracker />)).not.toThrow();
    const { result } = renderHook(() => useSafeBack('/support'));
    result.current();

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("'navigate' 로 초기화된 뒤에도 이후 push 이동은 플래그를 다시 켠다", async () => {
    seedStaleHistory();
    mockNavigationEntry('navigate');
    const { useSafeBack, InAppNavigationTracker } = await load();
    const view = render(<InAppNavigationTracker />);
    const { result } = renderHook(() => useSafeBack('/support'));

    result.current();
    expect(router.replace).toHaveBeenCalledWith('/support');
    expect(router.back).not.toHaveBeenCalled();

    navigate(view, '/support/inquiries/new', 'push');
    result.current();

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it("같은 문서에서 tracker 가 다시 마운트돼도('navigate') 다시 초기화하지 않는다", async () => {
    mockNavigationEntry('navigate');
    const { useSafeBack, InAppNavigationTracker } = await load();
    const view = render(<InAppNavigationTracker />);
    navigate(view, '/a', 'push');
    view.unmount();

    render(<InAppNavigationTracker />);
    const { result } = renderHook(() => useSafeBack('/support'));
    result.current();

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });
});

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useRefreshStatus } from './useRefreshStatus';

const UPDATING_MESSAGE = '이전 데이터 · 업데이트 중…';
const UPDATED_MESSAGE = '최신 정보로 업데이트되었습니다';
const ERROR_MESSAGE = '최신 정보를 가져오지 못했어요';
const UPDATED_MESSAGE_DURATION_MS = 3000;

type Input = { isFetching: boolean; hasError: boolean };

const renderStatus = (initial: Input) =>
  renderHook((props: Input) => useRefreshStatus(props), {
    initialProps: initial,
  });

describe('useRefreshStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('처음부터 idle(갱신 없음, 에러 없음)이면 빈 메시지를 돌려준다', () => {
    const { result } = renderStatus({ isFetching: false, hasError: false });

    expect(result.current.message).toBe('');
  });

  it('갱신 중이면 "이전 데이터 · 업데이트 중…"을 돌려준다', () => {
    const { result } = renderStatus({ isFetching: true, hasError: false });

    expect(result.current.message).toBe(UPDATING_MESSAGE);
  });

  it('갱신이 끝나면(true→false) 완료 메시지를 3초 동안 보여준 뒤 빈 메시지로 돌아간다', () => {
    const { result, rerender } = renderStatus({
      isFetching: true,
      hasError: false,
    });

    rerender({ isFetching: false, hasError: false });

    expect(result.current.message).toBe(UPDATED_MESSAGE);

    // 3초 직전까지는 완료 메시지가 유지된다
    act(() => {
      vi.advanceTimersByTime(UPDATED_MESSAGE_DURATION_MS - 1);
    });
    expect(result.current.message).toBe(UPDATED_MESSAGE);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.message).toBe('');
  });

  it('에러가 있으면 실패 메시지를 돌려준다', () => {
    const { result } = renderStatus({ isFetching: false, hasError: true });

    expect(result.current.message).toBe(ERROR_MESSAGE);
  });

  it('갱신 중이어도 에러가 있으면 실패 메시지가 우선한다', () => {
    const { result } = renderStatus({ isFetching: true, hasError: true });

    expect(result.current.message).toBe(ERROR_MESSAGE);
  });

  it('갱신이 에러로 끝나면(true→false + hasError) 완료 메시지 대신 실패 메시지를 돌려준다', () => {
    const { result, rerender } = renderStatus({
      isFetching: true,
      hasError: false,
    });

    rerender({ isFetching: false, hasError: true });

    expect(result.current.message).toBe(ERROR_MESSAGE);
    expect(result.current.message).not.toBe(UPDATED_MESSAGE);

    // 3초가 지나도 에러가 남아 있으면 실패 메시지가 유지된다
    act(() => {
      vi.advanceTimersByTime(UPDATED_MESSAGE_DURATION_MS);
    });
    expect(result.current.message).toBe(ERROR_MESSAGE);
  });

  it('완료 메시지 표시 중 에러가 발생하면 실패 메시지로 바뀐다', () => {
    const { result, rerender } = renderStatus({
      isFetching: true,
      hasError: false,
    });

    rerender({ isFetching: false, hasError: false });
    expect(result.current.message).toBe(UPDATED_MESSAGE);

    rerender({ isFetching: false, hasError: true });
    expect(result.current.message).toBe(ERROR_MESSAGE);
  });

  it('완료 메시지 표시 중 다시 갱신이 시작되면 "업데이트 중" 메시지로 바뀐다', () => {
    const { result, rerender } = renderStatus({
      isFetching: true,
      hasError: false,
    });

    rerender({ isFetching: false, hasError: false });
    expect(result.current.message).toBe(UPDATED_MESSAGE);

    rerender({ isFetching: true, hasError: false });
    expect(result.current.message).toBe(UPDATING_MESSAGE);
  });

  it('갱신을 두 번 반복하면 두 번째 완료 시에도 완료 메시지를 다시 보여준다', () => {
    const { result, rerender } = renderStatus({
      isFetching: true,
      hasError: false,
    });

    rerender({ isFetching: false, hasError: false });
    act(() => {
      vi.advanceTimersByTime(UPDATED_MESSAGE_DURATION_MS);
    });
    expect(result.current.message).toBe('');

    rerender({ isFetching: true, hasError: false });
    rerender({ isFetching: false, hasError: false });

    expect(result.current.message).toBe(UPDATED_MESSAGE);
  });
});

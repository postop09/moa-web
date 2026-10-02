'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react';

import { ADMIN_INQUIRY_KEYWORD_MIN } from '@/entities/admin';

const DEBOUNCE_MS = 300;

/**
 * 검색어 입력. 입력은 로컬 state 로 즉시 보여주고, 2자 이상(또는 비움)이면 300ms 뒤
 * 적용한다. Enter 는 기다리지 않고 바로 적용한다.
 *
 * 적용 여부는 prop 이 아니라 "마지막으로 보낸 검색어"와 비교한다(prop 은 서버 왕복 뒤에야 돈다).
 * prop 이 보낸 값(의 하나)으로 돌아오면 입력창을 건드리지 않고, 그 밖의 값이 오면(필터 초기화
 * 등 바깥 변경) 입력창을 그 값에 맞춘다.
 */
export const useKeywordInput = (
  appliedKeyword: string,
  onApply: (keyword: string) => void,
  inputRef: RefObject<HTMLInputElement | null>,
) => {
  const [value, setValue] = useState(appliedKeyword);
  const [seenKeyword, setSeenKeyword] = useState(appliedKeyword);
  // 보냈지만 아직 prop 으로 돌아오지 않은 검색어(보낸 순서).
  const [pending, setPending] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onApplyRef = useRef(onApply);

  useEffect(() => {
    onApplyRef.current = onApply;
  });

  if (appliedKeyword !== seenKeyword) {
    setSeenKeyword(appliedKeyword);

    const index = pending.indexOf(appliedKeyword);

    if (index >= 0) {
      setPending(pending.slice(index + 1));
    } else {
      setPending([]);
      setValue(appliedKeyword);
    }
  }

  const lastSent =
    pending.length > 0 ? pending[pending.length - 1] : seenKeyword;

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const send = useCallback((keyword: string) => {
    setPending((current) => [...current, keyword]);
    onApplyRef.current(keyword);
  }, []);

  const isApplicable = (keyword: string) =>
    keyword !== lastSent &&
    (keyword.length === 0 || keyword.length >= ADMIN_INQUIRY_KEYWORD_MIN);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    const trimmed = next.trim();

    setValue(next);
    clearTimer();

    if (!isApplicable(trimmed)) return;

    timer.current = setTimeout(() => {
      timer.current = null;
      send(trimmed);
    }, DEBOUNCE_MS);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;

    const trimmed = value.trim();

    clearTimer();

    if (isApplicable(trimmed)) send(trimmed);
  };

  /** 입력을 비우고 기다리지 않고 바로 적용한 뒤 포커스를 입력창으로 돌린다. */
  const clear = () => {
    clearTimer();
    setValue('');
    if (isApplicable('')) send('');
    inputRef.current?.focus();
  };

  const trimmedLength = value.trim().length;

  return {
    value,
    onChange,
    onKeyDown,
    clear,
    showClear: value.length > 0,
    // 1자만 입력한 상태: 검색이 적용되지 않는 이유를 알려준다.
    showHint: trimmedLength > 0 && trimmedLength < ADMIN_INQUIRY_KEYWORD_MIN,
  };
};

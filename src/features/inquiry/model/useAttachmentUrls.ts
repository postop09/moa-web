'use client';

import { useQuery } from '@tanstack/react-query';

import { getAttachmentUrls } from '@/entities/inquiry';
import { createBrowserClient } from '@/shared/api';

import { inquiryQueryKeys } from '../config/queryKeys';

/**
 * 서명 URL 의 수명은 1시간(getAttachmentUrls)이다. 만료된 URL 을 캐시에서 꺼내
 * 깨진 이미지를 보이지 않도록 수명보다 한참 짧은 30분 뒤에 stale 로 본다.
 */
const SIGNED_URL_STALE_MS = 30 * 60 * 1000;
/** 캐시에 남겨 두는 시간. 서명 URL 수명(1시간)을 넘기지 않도록 50분으로 제한한다. */
const SIGNED_URL_GC_MS = 50 * 60 * 1000;
/**
 * gcTime 은 마지막 언마운트부터 세므로 캐시가 서명 시각보다 오래될 수 있다.
 * 서명 후 55분이 지난 데이터는 만료 직전이라 쓰지 않는다(수명 60분에서 5분 여유).
 */
const SIGNED_URL_MAX_AGE_MS = 55 * 60 * 1000;
/** 마운트된 동안 만료 전에 다시 서명하는 주기(30분 이하). */
const SIGNED_URL_REFETCH_INTERVAL_MS = 25 * 60 * 1000;

const isTooOld = (updatedAt: number) =>
  Date.now() - updatedAt > SIGNED_URL_MAX_AGE_MS;

/** 입력 경로와 같은 순서의 서명 URL. 경로가 비어 있으면 조회하지 않는다. */
export const useAttachmentUrls = (paths: string[]) => {
  const enabled = paths.length > 0;
  const query = useQuery({
    queryKey: inquiryQueryKeys.attachmentUrls(paths),
    queryFn: () => getAttachmentUrls(createBrowserClient(), paths),
    enabled,
    staleTime: SIGNED_URL_STALE_MS,
    gcTime: SIGNED_URL_GC_MS,
    refetchInterval: enabled ? SIGNED_URL_REFETCH_INTERVAL_MS : false,
  });

  // 만료 임박 데이터는 없는 값으로 취급해 호출부가 로딩 상태를 보이게 한다.
  const isExpired = query.data !== undefined && isTooOld(query.dataUpdatedAt);

  return isExpired ? { ...query, data: undefined } : query;
};

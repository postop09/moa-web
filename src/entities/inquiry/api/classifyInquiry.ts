import type { ClassifyInquiryRes } from '../model/classifyInquiryRes';

const EMPTY: ClassifyInquiryRes = { category: null, confidence: null };

/** 분류 실패는 미분류로 취급한다. 취소(AbortError)만 호출부가 알 수 있게 다시 던진다. */
export const classifyInquiry = async (
  text: string,
  signal?: AbortSignal,
): Promise<ClassifyInquiryRes> => {
  try {
    const response = await fetch('/api/inquiries/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal,
    });

    if (!response.ok) return EMPTY;

    const data = (await response.json()) as Partial<ClassifyInquiryRes> | null;

    return {
      category: data?.category ?? null,
      confidence: data?.confidence ?? null,
    };
  } catch (error) {
    if ((error as { name?: string } | null)?.name === 'AbortError') throw error;

    return EMPTY;
  }
};

import { INQUIRY_CATEGORIES } from '../config/inquiryCategories';
import type { InquiryCategory } from '../config/inquiryCategories';
import { INQUIRY_CLASSIFY_THRESHOLD } from '../config/limits';
import type { ClassifyInquiryRes } from '../model/classifyInquiryRes';

type JevChoice = { choice: string; confidence: number };

const isInquiryCategory = (value: string): value is InquiryCategory =>
  (INQUIRY_CATEGORIES as string[]).includes(value);

/**
 * 알 수 없는 choice 또는 임계값 미만이면 category 를 null(미분류)로 둔다.
 * confidence 가 [0, 1] 밖이거나 유한하지 않으면 신뢰할 수 없어 둘 다 null.
 */
export const mapJevCategory = (
  result: JevChoice | null,
  threshold: number = INQUIRY_CLASSIFY_THRESHOLD,
): ClassifyInquiryRes => {
  if (!result) return { category: null, confidence: null };

  const { choice, confidence } = result;
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    return { category: null, confidence: null };
  }

  const category =
    isInquiryCategory(choice) && confidence >= threshold ? choice : null;

  return { category, confidence };
};
